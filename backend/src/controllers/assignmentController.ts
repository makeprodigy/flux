import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import mongoose from 'mongoose';
import { Assignment } from '../models/Assignment';
import { Result } from '../models/Result';
import { addGenerationJob } from '../queues/generationQueue';
import { deleteCache, CACHE_KEYS } from '../services/cacheService';
import { AssignmentInput } from '../types/assignment';
const pdfParse = require('pdf-parse');

// ── Create Assignment ─────────────────────────────────────────────────────────

export async function createAssignment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const body = req.body;
    let questionTypes = body.questionTypes;
    if (typeof questionTypes === 'string') {
      try {
        questionTypes = JSON.parse(questionTypes);
      } catch (e) {}
    }

    const {
      subject,
      topic,
      className,
      schoolName,
      timeAllowed,
      dueDate,
      additionalInfo,
    } = body as {
      subject: string;
      topic: string;
      className: string;
      schoolName: string;
      timeAllowed: string;
      dueDate: string;
      additionalInfo?: string;
    };

    // Extract file content and images if files were uploaded
    let fileContent: string | undefined;
    const images: { data: string; mimeType: string }[] = [];

    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files as Express.Multer.File[]) {
        if (file.mimetype === 'application/pdf') {
          const pdfData = await pdfParse(file.buffer);
          fileContent = fileContent ? fileContent + '\n' + pdfData.text : pdfData.text;
        } else if (file.mimetype.startsWith('image/')) {
          images.push({
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
          });
        } else {
          const text = file.buffer.toString('utf-8');
          fileContent = fileContent ? fileContent + '\n' + text : text;
        }
      }
    }

    const jobId = uuidv4();
    const userId = req.user.id;

    // Create and save the assignment document
    const assignment = new Assignment({
      userId: new mongoose.Types.ObjectId(userId),
      subject,
      topic,
      className,
      schoolName,
      timeAllowed,
      dueDate: new Date(dueDate),
      questionTypes,
      additionalInfo: additionalInfo ?? '',
      fileContent: fileContent ?? '',
      images,
      jobId,
      status: 'pending',
    });

    await assignment.save();

    // Build the input object for the generation job
    const input: AssignmentInput = {
      subject,
      topic,
      className,
      schoolName,
      timeAllowed,
      dueDate,
      questionTypes,
      additionalInfo,
      fileContent,
      images,
    };

    // Enqueue the generation job
    await addGenerationJob(jobId, {
      assignmentId: (assignment._id as mongoose.Types.ObjectId).toString(),
      userId,
      input,
    });

    // Invalidate the user's assignments cache
    await deleteCache(CACHE_KEYS.assignments(userId));

    res.status(201).json({
      success: true,
      data: {
        assignmentId: (assignment._id as mongoose.Types.ObjectId).toString(),
        jobId,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create assignment';
    res.status(500).json({ success: false, message });
  }
}

// ── Get All Assignments ───────────────────────────────────────────────────────

export async function getAssignments(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 100;
    const skip = (page - 1) * limit;

    const assignments = await Assignment.find({
      userId: new mongoose.Types.ObjectId(req.user.id),
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    res.status(200).json({
      success: true,
      data: assignments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch assignments';
    res.status(500).json({ success: false, message });
  }
}

// ── Get Single Assignment ─────────────────────────────────────────────────────

export async function getAssignment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid assignment ID.' });
      return;
    }

    const assignment = await Assignment.findById(id).lean();

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    // Check ownership
    if (assignment.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    res.status(200).json({ success: true, data: assignment });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch assignment';
    res.status(500).json({ success: false, message });
  }
}

// ── Delete Assignment ─────────────────────────────────────────────────────────

export async function deleteAssignment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid assignment ID.' });
      return;
    }

    const assignment = await Assignment.findById(id);

    if (!assignment) {
      res.status(404).json({ success: false, message: 'Assignment not found.' });
      return;
    }

    // Check ownership
    if (assignment.userId.toString() !== req.user.id) {
      res.status(403).json({ success: false, message: 'Access denied.' });
      return;
    }

    // Delete associated result if it exists
    if (assignment.resultId) {
      const result = await Result.findByIdAndDelete(assignment.resultId);
      if (result && assignment.jobId) {
        // Evict result cache
        await deleteCache(CACHE_KEYS.result(assignment.jobId));
      }
    }

    await assignment.deleteOne();

    // Invalidate the user's assignments cache
    await deleteCache(CACHE_KEYS.assignments(req.user.id));

    res.status(200).json({ success: true, message: 'Assignment deleted successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete assignment';
    res.status(500).json({ success: false, message });
  }
}

// ── Seed Dummy Assignments ────────────────────────────────────────────────────

export async function seedAssignments(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authenticated.' });
      return;
    }

    const userId = new mongoose.Types.ObjectId(req.user.id);
    
    const existing = await Assignment.countDocuments({ userId });
    if (existing > 0) {
      res.status(400).json({ success: false, message: 'Account already has assignments. Cannot seed.' });
      return;
    }

    const dummyData = [
      { subject: 'Science', topic: 'Electricity and Circuits', className: 'Grade 8' },
      { subject: 'Mathematics', topic: 'Algebraic Expressions', className: 'Grade 7' },
      { subject: 'History', topic: 'The French Revolution', className: 'Grade 9' },
      { subject: 'English', topic: 'Shakespearean Sonnets', className: 'Grade 10' },
      { subject: 'Physics', topic: 'Laws of Motion', className: 'Grade 11' },
      { subject: 'Chemistry', topic: 'Periodic Table', className: 'Grade 10' },
      { subject: 'Biology', topic: 'Human Digestive System', className: 'Grade 9' },
      { subject: 'Geography', topic: 'Climate Change', className: 'Grade 8' },
      { subject: 'Computer Science', topic: 'Introduction to Python', className: 'Grade 11' },
      { subject: 'Economics', topic: 'Supply and Demand', className: 'Grade 12' },
      { subject: 'Mathematics', topic: 'Trigonometry', className: 'Grade 10' },
      { subject: 'Science', topic: 'Acids, Bases, and Salts', className: 'Grade 10' },
      { subject: 'History', topic: 'World War II', className: 'Grade 12' },
      { subject: 'English', topic: 'Creative Writing', className: 'Grade 8' },
      { subject: 'Physics', topic: 'Thermodynamics', className: 'Grade 12' }
    ];

    const assignmentsToInsert = [];
    const resultsToInsert = [];

    for (let i = 0; i < dummyData.length; i++) {
      const data = dummyData[i];
      const date = new Date();
      date.setDate(date.getDate() - i); 
      
      const jobId = uuidv4();
      const assignmentId = new mongoose.Types.ObjectId();
      const resultId = new mongoose.Types.ObjectId();

      assignmentsToInsert.push({
        _id: assignmentId,
        userId,
        ...data,
        schoolName: 'Veda AI Academy',
        timeAllowed: '45 mins',
        dueDate: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000), 
        questionTypes: [
          { type: 'multiple_choice', count: 5, marks: 1 },
          { type: 'short_answer', count: 3, marks: 2 },
          { type: 'long_answer', count: 1, marks: 5 }
        ],
        additionalInfo: 'Auto-generated seed assignment.',
        fileContent: '',
        images: [],
        jobId,
        resultId,
        status: 'completed', 
        createdAt: date,
        updatedAt: date
      });

      resultsToInsert.push({
        _id: resultId,
        jobId,
        assignmentId,
        userId,
        paper: {
          schoolName: 'Veda AI Academy',
          subject: data.subject,
          className: data.className,
          timeAllowed: '45 mins',
          totalMarks: 16,
          generalInstruction: 'Attempt all questions carefully. This is a dummy generated paper.',
          sections: [
            {
              title: 'Section A: Multiple Choice',
              instruction: 'Choose the correct option.',
              questions: Array.from({ length: 5 }).map((_, idx) => ({
                id: `q${idx+1}`,
                text: `Dummy Multiple Choice Question ${idx+1} for ${data.topic}`,
                difficulty: 'easy',
                marks: 1,
                type: 'multiple_choice'
              }))
            },
            {
              title: 'Section B: Short Answer',
              instruction: 'Answer in 2-3 lines.',
              questions: Array.from({ length: 3 }).map((_, idx) => ({
                id: `q${idx+6}`,
                text: `Dummy Short Answer Question ${idx+1} for ${data.topic}`,
                difficulty: 'moderate',
                marks: 2,
                type: 'short_answer'
              }))
            },
            {
              title: 'Section C: Long Answer',
              instruction: 'Answer in detail.',
              questions: [
                {
                  id: 'q9',
                  text: `Explain the core concepts of ${data.topic} in detail.`,
                  difficulty: 'challenging',
                  marks: 5,
                  type: 'long_answer'
                }
              ]
            }
          ],
          answerKey: [
            { questionId: 'q1', answer: 'A' },
            { questionId: 'q2', answer: 'B' },
            { questionId: 'q3', answer: 'C' },
            { questionId: 'q4', answer: 'D' },
            { questionId: 'q5', answer: 'A' },
            { questionId: 'q6', answer: 'Short answer definition goes here.' },
            { questionId: 'q7', answer: 'Short answer explanation goes here.' },
            { questionId: 'q8', answer: 'Short answer context goes here.' },
            { questionId: 'q9', answer: 'Detailed long answer explanation of the concepts.' }
          ]
        },
        createdAt: date
      });
    }

    await Result.insertMany(resultsToInsert);
    await Assignment.insertMany(assignmentsToInsert);
    await deleteCache(CACHE_KEYS.assignments(req.user.id));

    res.status(201).json({ success: true, message: '15 dummy assignments seeded successfully.' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to seed assignments';
    res.status(500).json({ success: false, message });
  }
}
