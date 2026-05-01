import { useEffect, useRef, useState } from "react";
import {
  emptyApplication,
  interviewResultOptions,
  interviewRoundOptions,
  roleTypeOptions,
  statusOptions
} from "../utils/constants";

const createStage = () => ({
  round: "First round",
  date: "",
  result: "Pending",
  notes: ""
});

const Input = (props) => (
  <input 
    {...props} 
    className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-violet-500 outline-none transition-all focus:ring-4 focus:ring-violet-500/10 placeholder:text-neutral-600 ${props.className || ""}`} 
  />
);

const Select = (props) => (
  <select 
    {...props} 
    className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-violet-500 outline-none transition-all focus:ring-4 focus:ring-violet-500/10 ${props.className || ""}`}
  />
);

const TextArea = (props) => (
  <textarea 
    {...props} 
    className={`w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm focus:border-violet-500 outline-none transition-all focus:ring-4 focus:ring-violet-500/10 placeholder:text-neutral-600 ${props.className || ""}`}
  />
);

const Label = ({ children }) => (
  <label className="text-[11px] font-bold uppercase tracking-widest text-neutral-400 mb-1 block">
    {children}
  </label>
);

const ApplicationForm = ({ initialValues, onSubmit, onCancel, saving }) => {
  const [formData, setFormData] = useState(emptyApplication);
  const editingId = initialValues?._id ?? null;
  const prevEditingIdRef = useRef(editingId);

  useEffect(() => {
    if (editingId === prevEditingIdRef.current) {
      return;
    }
    prevEditingIdRef.current = editingId;

    if (initialValues) {
      setFormData({
        ...emptyApplication,
        ...initialValues,
        appliedDate: initialValues.appliedDate?.slice(0, 10) || "",
        followUpDate: initialValues.followUpDate?.slice(0, 10) || "",
        interviewStages: (initialValues.interviewStages || []).map((stage) => ({
          ...stage,
          date: stage.date?.slice(0, 10) || ""
        }))
      });
    } else {
      setFormData(emptyApplication);
    }
  });

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleStageChange = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      interviewStages: current.interviewStages.map((stage, stageIndex) =>
        stageIndex === index ? { ...stage, [field]: value } : stage
      )
    }));
  };

  const addStage = () => {
    setFormData((current) => ({
      ...current,
      interviewStages: [...current.interviewStages, createStage()]
    }));
  };

  const removeStage = (index) => {
    setFormData((current) => ({
      ...current,
      interviewStages: current.interviewStages.filter((_, stageIndex) => stageIndex !== index)
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="space-y-10">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="font-h2 text-on-background">{initialValues?._id ? "Application Details" : "New Application"}</h2>
          <p className="text-sm text-neutral-400">{initialValues?._id ? "Review and update your data" : "Log a new opportunity"}</p>
        </div>
        {onCancel && (
          <button onClick={onCancel} className="p-3 hover:bg-white/10 rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        )}
      </div>

      <form className="space-y-8" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <Label>Company Name</Label>
            <Input name="companyName" value={formData.companyName} onChange={handleChange} required placeholder="e.g. Stripe, Linear" />
          </div>
          <div className="space-y-1">
            <Label>Role</Label>
            <Input name="role" value={formData.role} onChange={handleChange} required placeholder="e.g. Software Engineer" />
          </div>
          <div className="space-y-1">
            <Label>Role Type</Label>
            <Select name="roleType" value={formData.roleType} onChange={handleChange}>
              {roleTypeOptions.map((option) => (
                <option key={option} value={option} className="bg-neutral-900">{option}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Applied Date</Label>
            <Input type="date" name="appliedDate" value={formData.appliedDate} onChange={handleChange} required />
          </div>
          <div className="space-y-1">
            <Label>Status</Label>
            <Select name="status" value={formData.status} onChange={handleChange}>
              {statusOptions.map((option) => (
                <option key={option} value={option} className="bg-neutral-900">{option}</option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Follow-up Date</Label>
            <Input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
          </div>
          <div className="col-span-1 md:col-span-2 space-y-1">
            <Label>Portfolio or Resume Link</Label>
            <Input name="portfolioLink" value={formData.portfolioLink} onChange={handleChange} placeholder="https://your-portfolio.dev" />
          </div>
          <div className="col-span-1 md:col-span-2 flex items-center gap-3 p-4 glass-card rounded-xl">
            <input 
              type="checkbox" 
              name="portfolioViewed" 
              checked={formData.portfolioViewed} 
              onChange={handleChange}
              className="w-5 h-5 rounded border-white/10 bg-white/5 text-violet-500 focus:ring-violet-500/50"
            />
            <span className="text-sm font-medium">Portfolio viewed by company</span>
          </div>
          <div className="col-span-1 md:col-span-2 space-y-1">
            <Label>Notes</Label>
            <TextArea name="notes" value={formData.notes} onChange={handleChange} rows="3" placeholder="Context, tech stack, etc." />
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-t border-white/5 pt-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-neutral-400">Interview Stages</h3>
            <button type="button" onClick={addStage} className="text-[10px] bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg font-bold uppercase tracking-widest transition-all">
              Add Stage
            </button>
          </div>

          {formData.interviewStages.length === 0 && (
            <p className="text-xs text-neutral-500 italic">No stages documented yet.</p>
          )}

          <div className="space-y-6">
            {formData.interviewStages.map((stage, index) => (
              <div className="p-6 glass-card rounded-2xl space-y-4 relative group" key={index}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label>Round</Label>
                    <Select value={stage.round} onChange={(event) => handleStageChange(index, "round", event.target.value)}>
                      {interviewRoundOptions.map((option) => (
                        <option key={option} value={option} className="bg-neutral-900">{option}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Date</Label>
                    <Input type="date" value={stage.date} onChange={(event) => handleStageChange(index, "date", event.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label>Result</Label>
                    <Select value={stage.result} onChange={(event) => handleStageChange(index, "result", event.target.value)}>
                      {interviewResultOptions.map((option) => (
                        <option key={option} value={option} className="bg-neutral-900">{option}</option>
                      ))}
                    </Select>
                  </div>
                  <div className="col-span-1 md:col-span-2 space-y-1">
                    <Label>Notes</Label>
                    <TextArea rows="2" value={stage.notes} onChange={(event) => handleStageChange(index, "notes", event.target.value)} placeholder="What happened?" />
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => removeStage(index)}
                  className="text-[10px] text-error hover:underline font-bold uppercase tracking-widest"
                >
                  Remove Stage
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex gap-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-sm font-semibold rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="flex-1 py-4 bg-primary-container text-on-primary-container text-sm font-semibold rounded-xl shadow-lg shadow-violet-900/20 hover:brightness-110 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? "Synchronizing..." : initialValues?._id ? "Update Application" : "Create Application"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicationForm;
