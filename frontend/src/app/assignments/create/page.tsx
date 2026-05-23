'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, Trash2, Plus, Sparkles, ChevronDown, Check, CalendarIcon, ArrowLeft, ArrowRight, CloudUpload, Mic } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import CustomSelect from '@/components/ui/CustomSelect';
import QuestionTypeRow from '@/components/create/QuestionTypeRow';
import { toast } from 'sonner';
import { useAssignmentStore } from '@/store/assignmentStore';
import { useJobStore } from '@/store/jobStore';
import { assignmentsApi } from '@/lib/api';
import { wsClient } from '@/lib/websocket';

const SUBJECT_OPTIONS = [
  { value: 'Mathematics', label: 'Mathematics' },
  { value: 'Physics', label: 'Physics' },
  { value: 'Chemistry', label: 'Chemistry' },
  { value: 'Biology', label: 'Biology' },
  { value: 'Science', label: 'General Science' },
  { value: 'English', label: 'English' },
  { value: 'History', label: 'History' },
  { value: 'Geography', label: 'Geography' },
  { value: 'Computer Science', label: 'Computer Science' },
  { value: 'Economics', label: 'Economics' },
  { value: 'Literature', label: 'Literature' },
  { value: 'Other', label: 'Other...' }
];

const CLASS_OPTIONS = [
  { value: '1st Grade', label: '1st Grade' },
  { value: '2nd Grade', label: '2nd Grade' },
  { value: '3rd Grade', label: '3rd Grade' },
  { value: '4th Grade', label: '4th Grade' },
  { value: '5th Grade', label: '5th Grade' },
  { value: '6th Grade', label: '6th Grade' },
  { value: '7th Grade', label: '7th Grade' },
  { value: '8th Grade', label: '8th Grade' },
  { value: '9th Grade', label: '9th Grade' },
  { value: '10th Grade', label: '10th Grade' },
  { value: '11th Grade', label: '11th Grade' },
  { value: '12th Grade', label: '12th Grade' },
  { value: 'Other', label: 'Other...' }
];

export default function CreateAssignmentPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isOtherClass, setIsOtherClass] = useState(false);
  const [isOtherSubject, setIsOtherSubject] = useState(false);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');

  const handleTimeChange = (h: string, m: string) => {
    setHours(h);
    setMinutes(m);
    const parts = [];
    if (h && h !== '0') parts.push(`${h} hour${h === '1' ? '' : 's'}`);
    if (m && m !== '0') parts.push(`${m} minute${m === '1' ? '' : 's'}`);
    store.setField('timeAllowed', parts.join(' '));
  };

  const store = useAssignmentStore();
  const jobStore = useJobStore();

  const totalQuestions = store.questionTypes.reduce((s, q) => s + q.count, 0);
  const totalMarks = store.questionTypes.reduce((s, q) => s + q.count * q.marks, 0);

  const handleFileSelect = (file: File) => {
    store.setFile(file);
  };

  const validateStep1 = () => {
    const e: Record<string, string> = {};
    if (!store.dueDate) e.dueDate = 'Due date is required';
    if (store.questionTypes.length === 0) e.questionTypes = 'Add at least one question type';
    store.questionTypes.forEach((q, i) => {
      if (q.count < 1) e[`count_${i}`] = 'Count must be at least 1';
      if (q.marks < 1) e[`marks_${i}`] = 'Marks must be at least 1';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!store.subject.trim()) e.subject = 'Subject is required';
    if (!store.topic.trim()) e.topic = 'Topic is required';
    if (!store.className.trim()) e.className = 'Class is required';
    if (!store.schoolName.trim()) e.schoolName = 'School name is required';
    if (!store.timeAllowed.trim()) e.timeAllowed = 'Time allowed is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) store.nextStep();
  };

  const handleSubmit = async () => {
    if (!validateStep2()) return;
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('subject', store.subject);
      formData.append('topic', store.topic);
      formData.append('className', store.className);
      formData.append('schoolName', store.schoolName);
      formData.append('timeAllowed', store.timeAllowed);
      formData.append('dueDate', store.dueDate);
      formData.append('additionalInfo', store.additionalInfo);
      
      formData.append('questionTypes', JSON.stringify(store.questionTypes));

      if (store.uploadedFile) {
        formData.append('file', store.uploadedFile);
      }

      store.diagramFiles.forEach((df, i) => {
        formData.append(`diagram_${i}`, df.file);
      });

      const res = await assignmentsApi.create(formData);
      const { jobId } = res.data.data;

      jobStore.setJob(jobId);

      const toastId = toast.loading('Generating your question paper... 0%', {
        description: 'Connecting to AI...',
      });

      wsClient.connect(
        jobId,
        (progress, message) => {
          jobStore.setProgress(progress, message);
          toast.loading(`Generating your question paper... ${progress}%`, {
            id: toastId,
            description: message || 'This usually takes 10-30 seconds',
          });
        },
        (resultId) => {
          wsClient.disconnect();
          jobStore.setComplete(resultId);
          toast.success('Question paper generated successfully!', {
            id: toastId,
            description: 'Your assignment is ready to view.',
            action: {
              label: 'View Paper',
              onClick: () => router.push(`/assignments/result/${jobId}`),
            },
            duration: 10000,
          });
        },
        (error) => {
          wsClient.disconnect();
          jobStore.setFailed(error);
          toast.error(`Generation failed`, {
            id: toastId,
            description: error || 'An error occurred during generation.',
            duration: 6000,
          });
        }
      );

      store.reset();
      setHours('');
      setMinutes('');
      setIsOtherClass(false);
      setIsOtherSubject(false);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create assignment';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const step = store.currentStep;

  return (
    <AppLayout title="Create Assignment" backHref="/dashboard">

      {/* Mobile Page Header */}
      <div className="flex md:hidden items-center justify-between mb-2 mt-2 px-4 relative">
        <button onClick={() => router.back()} className="absolute left-4 w-8 h-8 rounded-full bg-white flex items-center justify-center border border-gray-100 shadow-sm cursor-pointer z-10">
          <ArrowLeft size={16} className="text-[#352B25]" />
        </button>
        <h1 className="w-full text-center font-heading text-[16px] font-bold text-[#352B25] tracking-tight">Create Assignment</h1>
      </div>

      <div className="max-w-[720px] mx-auto my-4 md:my-6 px-4 sm:px-5 pb-24">
        {/* Desktop Page Title */}
        <div className="hidden md:block mb-6">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E] shadow-[0_0_8px_rgba(34,197,94,0.4)]"></div>
            <h1 className="font-heading text-[16px] font-bold text-[#352B25]">Create Assignment</h1>
          </div>
          <p className="text-[12px] text-[#A3A3A3] font-body ml-4.5">Set up a new assignment for your students</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <div className="flex-1 h-1.5 bg-[#352B25] rounded-full" />
          <div className={`flex-1 h-1.5 rounded-full transition-colors duration-300 ${step === 2 ? 'bg-[#352B25]' : 'bg-[#E5E5E5]'}`} />
        </div>

        <div className="bg-[#FAFAFA]/85 backdrop-blur-[12px] border border-white/50 shadow-[16px_0_80px_rgba(0,0,0,0.25),4px_0_24px_rgba(0,0,0,0.15)] rounded-[24px] sm:rounded-[32px] p-4 sm:p-8">

        {/* ─── STEP 1 ─── */}
        {step === 1 && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="font-heading text-[16px] font-bold mb-1 tracking-tight text-[#352B25]">
                Assignment Details
              </h2>
              <p className="font-body text-[#9CA3AF] text-[12px] font-normal leading-relaxed">
                Basic information about your assignment
              </p>
            </div>

            {/* File Upload */}
            <div
              className={`upload-zone mb-3 py-8 px-5 rounded-2xl border-2 border-dashed border-[#E5E5E5] bg-white/60 backdrop-blur-[24px] text-center cursor-pointer ${dragOver ? 'drag-over' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFileSelect(f); }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.png,.jpg,.jpeg"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />
              <CloudUpload size={28} className="text-[#352B25] mx-auto mb-3" />
              {store.uploadedFileName ? (
                <p className="font-inter font-semibold text-sm text-[#352B25]">{store.uploadedFileName}</p>
              ) : (
                <>
                  <p className="font-inter font-semibold text-[13px] mb-1.5 text-[#352B25]">
                    Choose a file or drag & drop it here
                  </p>
                  <p className="text-[#A9A9A9] text-[11px] mb-4">JPEG, PNG, upto 10MB</p>
                  <button type="button" className="bg-[#F4F4F4] border border-[#EFEFEF] rounded-full py-1.5 px-4 text-[12px] font-medium text-[#352B25] pointer-events-none">Browse Files</button>
                </>
              )}
            </div>
            <p className="text-center text-[13px] text-[#A9A9A9] mb-6">Upload images of your preferred document/image</p>

            {/* Due Date */}
            <div className="mb-6">
              <label className="block text-[12px] font-semibold text-[#352B25] mb-2 font-inter">Due Date</label>
              <div className="relative">
                  <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={store.dueDate}
                  onChange={(e) => store.setField('dueDate', e.target.value)}
                  className={`form-input rounded-full w-full ${errors.dueDate ? 'error' : ''}`}
                />
              </div>
              {errors.dueDate && <p className="form-error">{errors.dueDate}</p>}
            </div>

            {/* Question Structure */}
            <div className="mb-4">
              {/* Column headers */}
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto] gap-3 pb-2">
                <span className="font-heading text-[12px] font-semibold text-[#352B25]">Question Type</span>
                <span />
                <span className="font-inter text-[12px] font-semibold text-[#352B25] text-center min-w-[130px]">No. of Questions</span>
                <span className="font-inter text-[12px] font-semibold text-[#352B25] text-center min-w-[110px]">Marks</span>
              </div>

              {store.questionTypes.map((qt, i) => (
                <QuestionTypeRow
                  key={i}
                  config={qt}
                  index={i}
                  diagramFile={store.diagramFiles.find(d => d.index === i)?.file}
                  onUpdate={store.updateQuestionType}
                  onRemove={store.removeQuestionType}
                  onDiagramUpload={store.setDiagramFile}
                  onDiagramRemove={store.removeDiagramFile}
                />
              ))}
              {errors.questionTypes && <p className="form-error">{errors.questionTypes}</p>}

              <div className="flex justify-between items-start mt-3 mb-6">
                {/* Add button */}
                <button
                  onClick={store.addQuestionType}
                  className="flex items-center gap-2.5 bg-transparent border-none cursor-pointer font-inter text-[12px] font-semibold text-[#352B25]"
                >
                  <div className="w-7 h-7 rounded-full bg-[#352B25] flex items-center justify-center">
                    <Plus size={16} color="white" strokeWidth={2.5} />
                  </div>
                  Add Question Type
                </button>

                {/* Totals */}
                <div className="flex flex-col items-end gap-1.5 pt-1">
                  <div className="font-inter text-[12px] text-[#352B25] font-medium">
                    Total Questions : <strong className="font-semibold">{totalQuestions}</strong>
                  </div>
                  <div className="font-inter text-[12px] text-[#352B25] font-medium">
                    Total Marks : <strong className="font-semibold">{totalMarks}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mb-8">
              <label className="block text-[12px] font-semibold text-[#352B25] mb-2 font-inter">Additional Information (For better output)</label>
              <div className="relative">
                <textarea
                  value={store.additionalInfo}
                  onChange={(e) => store.setField('additionalInfo', e.target.value)}
                  placeholder="e.g Generate a question paper for 3 hour exam duration..."
                  rows={4}
                  className="form-input rounded-[20px] border-2 border-dashed border-[#E5E5E5] resize-y pr-12 p-4 w-full"
                />
                <Mic size={20} className="absolute right-3.5 bottom-3.5 text-[#352B25] cursor-pointer" />
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between mt-8">
              <button className="sharp-btn-secondary" onClick={() => router.push('/dashboard')}>← Previous</button>
              <button className="sharp-btn-primary" onClick={handleNext}>Next →</button>
            </div>
          </div>
        )}

        {/* ─── STEP 2 ─── */}
        {step === 2 && (
          <div className="fade-in">
            <div className="mb-6">
              <h2 className="font-heading text-[16px] font-bold mb-1 tracking-tight text-[#352B25]">
                Additional Details
              </h2>
              <p className="font-body text-[#9CA3AF] text-[12px] font-normal leading-relaxed">
                Provide extra context for the assignment
              </p>
            </div>

            {/* Subject + Topic */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#352B25] mb-1.5 font-inter">Subject</label>
                {!isOtherSubject ? (
                  <CustomSelect
                    value={store.subject}
                    options={SUBJECT_OPTIONS}
                    placeholder="Select Subject"
                    hasError={!!errors.subject}
                    onChange={(val) => {
                      if (val === 'Other') {
                        setIsOtherSubject(true);
                        store.setField('subject', '');
                      } else {
                        store.setField('subject', val);
                      }
                    }}
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={store.subject}
                      onChange={(e) => store.setField('subject', e.target.value)}
                      className={`w-full bg-white rounded-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-2.5 text-[13px] font-semibold text-[#352B25] outline-none ${errors.subject ? 'border-red-500 border' : ''}`}
                      placeholder="Enter subject"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="bg-[#352B25] text-white rounded-full px-3 font-bold text-[11px] border-none cursor-pointer"
                      onClick={() => {
                        setIsOtherSubject(false);
                        store.setField('subject', '');
                      }}
                    >
                      Back
                    </button>
                  </div>
                )}
                {errors.subject && <p className="form-error text-[10px]">{errors.subject}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#352B25] mb-1.5 font-inter">Topic</label>
                <input value={store.topic} onChange={(e) => store.setField('topic', e.target.value)} className={`w-full bg-white rounded-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-2.5 text-[13px] font-semibold text-[#352B25] outline-none placeholder:text-[#A3A3A3] ${errors.topic ? 'border-red-500 border' : ''}`} placeholder="e.g. Electricity" />
                {errors.topic && <p className="form-error text-[10px]">{errors.topic}</p>}
              </div>
            </div>

            {/* Class + School */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-[12px] font-semibold text-[#352B25] mb-1.5 font-inter">Class / Grade</label>
                {!isOtherClass ? (
                  <CustomSelect
                    value={store.className}
                    options={CLASS_OPTIONS}
                    placeholder="Select Class"
                    hasError={!!errors.className}
                    onChange={(val) => {
                      if (val === 'Other') {
                        setIsOtherClass(true);
                        store.setField('className', '');
                      } else {
                        store.setField('className', val);
                      }
                    }}
                  />
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={store.className}
                      onChange={(e) => store.setField('className', e.target.value)}
                      className={`w-full bg-white rounded-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-2.5 text-[13px] font-semibold text-[#352B25] outline-none ${errors.className ? 'border-red-500 border' : ''}`}
                      placeholder="Class"
                      autoFocus
                    />
                    <button
                      type="button"
                      className="bg-[#352B25] text-white rounded-full px-3 font-bold text-[11px] border-none cursor-pointer"
                      onClick={() => {
                        setIsOtherClass(false);
                        store.setField('className', '');
                      }}
                    >
                      Back
                    </button>
                  </div>
                )}
                {errors.className && <p className="form-error text-[10px]">{errors.className}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#352B25] mb-1.5 font-inter">School Name</label>
                <input value={store.schoolName} onChange={(e) => store.setField('schoolName', e.target.value)} className={`w-full bg-white rounded-full border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] px-4 py-2.5 text-[13px] font-semibold text-[#352B25] outline-none placeholder:text-[#A3A3A3] ${errors.schoolName ? 'border-red-500 border' : ''}`} placeholder="e.g. DPS" />
                {errors.schoolName && <p className="form-error text-[10px]">{errors.schoolName}</p>}
              </div>
            </div>

            {/* Time Allowed */}
            <div className="mb-8">
              <label className="block text-[12px] font-semibold text-[#352B25] mb-1.5 font-inter">Time Allowed</label>
              <div className="flex gap-3">
                <div className={`flex items-center justify-between rounded-full flex-1 bg-white border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-[44px] px-3.5 ${errors.timeAllowed ? 'border-red-500 border' : ''}`}>
                  <button type="button" className="counter-btn w-5 h-5 text-lg flex items-center justify-center text-[#352B25]" onClick={() => handleTimeChange((Math.max(0, parseInt(hours || '0') - 1)).toString(), minutes)}>−</button>
                  <label className="flex items-center justify-center flex-1 cursor-text h-full py-2">
                    <input
                      type="number"
                      className="hide-spin-button w-6 text-right border-none outline-none text-[13px] bg-transparent text-[#352B25] font-semibold p-0 focus:ring-0"
                      min="0"
                      placeholder="0"
                      value={hours}
                      onChange={(e) => {
                        if (e.target.value === '') handleTimeChange('', minutes);
                        else handleTimeChange(Math.max(0, parseInt(e.target.value)).toString(), minutes);
                      }}
                    />
                    <span className="text-[13px] text-[#A3A3A3] ml-1 font-semibold select-none">hrs</span>
                  </label>
                  <button type="button" className="counter-btn w-5 h-5 text-lg flex items-center justify-center text-[#352B25]" onClick={() => handleTimeChange((parseInt(hours || '0') + 1).toString(), minutes)}>+</button>
                </div>
                <div className={`flex items-center justify-between rounded-full flex-1 bg-white border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] h-[44px] px-3.5 ${errors.timeAllowed ? 'border-red-500 border' : ''}`}>
                  <button type="button" className="counter-btn w-5 h-5 text-lg flex items-center justify-center text-[#352B25]" onClick={() => handleTimeChange(hours, (Math.max(0, parseInt(minutes || '0') - 1)).toString())}>−</button>
                  <label className="flex items-center justify-center flex-1 cursor-text h-full py-2">
                    <input
                      type="number"
                      className="hide-spin-button w-6 text-right border-none outline-none text-[13px] bg-transparent text-[#352B25] font-semibold p-0 focus:ring-0"
                      min="0"
                      max="59"
                      placeholder="0"
                      value={minutes}
                      onChange={(e) => {
                        if (e.target.value === '') handleTimeChange(hours, '');
                        else handleTimeChange(hours, Math.max(0, parseInt(e.target.value)).toString());
                      }}
                    />
                    <span className="text-[13px] text-[#A3A3A3] ml-1 font-semibold select-none">mins</span>
                  </label>
                  <button type="button" className="counter-btn w-5 h-5 text-lg flex items-center justify-center text-[#352B25]" onClick={() => handleTimeChange(hours, (Math.min(59, parseInt(minutes || '0') + 1)).toString())}>+</button>
                </div>
              </div>
              {errors.timeAllowed && <p className="form-error text-[10px] mt-1">{errors.timeAllowed}</p>}
            </div>

            {/* Navigation */}
            <div className="flex justify-center gap-3 sm:gap-4 mt-6 pb-2">
              <button 
                className="flex flex-col items-center justify-center bg-white text-[#352B25] rounded-[24px] w-[90px] h-[60px] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-none font-bold text-[13px] font-heading transition-all active:scale-95 cursor-pointer" 
                onClick={() => store.prevStep()}
              >
                <ArrowLeft size={16} strokeWidth={2.5} className="mb-0.5" /> Previous
              </button>
              <button 
                className="flex flex-col items-center justify-center bg-[#352B25] text-white rounded-[24px] flex-1 max-w-[180px] h-[60px] shadow-[0_4px_16px_rgba(0,0,0,0.15)] border-none font-bold text-[14px] font-heading transition-all active:scale-95 cursor-pointer"
                onClick={handleSubmit} disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Creating...' : 'Create'}</span>
                <span className="flex items-center gap-1">{isSubmitting ? '' : 'Assignment'} {!isSubmitting && <ArrowRight size={14} strokeWidth={2.5} />}</span>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  );
}
