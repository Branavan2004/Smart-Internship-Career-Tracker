import { useEffect, useState } from "react";
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

const ApplicationForm = ({ initialValues, onSubmit, onCancel, saving }) => {
  const [formData, setFormData] = useState(emptyApplication);

  useEffect(() => {
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
      return;
    }

    setFormData(emptyApplication);
  }, [initialValues]);

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
    <section className="panel form-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">{initialValues?._id ? "Edit application" : "Add application"}</p>
          <h2>{initialValues?._id ? "Update your pipeline" : "Log a new opportunity"}</h2>
        </div>
        {onCancel ? (
          <button type="button" className="ghost-button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>

      <form className="application-form" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label>
            Company name
            <input name="companyName" value={formData.companyName} onChange={handleChange} required />
          </label>
          <label>
            Role
            <input name="role" value={formData.role} onChange={handleChange} required />
          </label>
          <label>
            Role type
            <select name="roleType" value={formData.roleType} onChange={handleChange}>
              {roleTypeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Applied date
            <input type="date" name="appliedDate" value={formData.appliedDate} onChange={handleChange} required />
          </label>
          <label>
            Status
            <select name="status" value={formData.status} onChange={handleChange}>
              {statusOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label>
            Follow-up date
            <input type="date" name="followUpDate" value={formData.followUpDate} onChange={handleChange} />
          </label>
          <label className="field-span-2">
            Portfolio or resume link
            <input name="portfolioLink" value={formData.portfolioLink} onChange={handleChange} placeholder="https://your-portfolio.dev" />
          </label>
          <label className="checkbox-row">
            <input type="checkbox" name="portfolioViewed" checked={formData.portfolioViewed} onChange={handleChange} />
            Portfolio viewed by company
          </label>
          <label className="field-span-2">
            Notes
            <textarea name="notes" value={formData.notes} onChange={handleChange} rows="3" />
          </label>
          <label className="field-span-2">
            Feedback
            <textarea name="feedback" value={formData.feedback} onChange={handleChange} rows="3" />
          </label>
          <label className="field-span-2">
            Rejection reason
            <input name="rejectionReason" value={formData.rejectionReason} onChange={handleChange} placeholder="Culture fit, limited openings, timing..." />
          </label>
        </div>

        <div className="stage-section">
          <div className="section-title-row">
            <h3>Interview stages</h3>
            <button type="button" className="secondary-button" onClick={addStage}>
              Add stage
            </button>
          </div>

          {formData.interviewStages.length === 0 ? (
            <p className="muted-text">No stages yet. Add one when the process starts moving.</p>
          ) : null}

          {formData.interviewStages.map((stage, index) => (
            <div className="stage-card" key={`${stage.round}-${index}`}>
              <div className="field-grid">
                <label>
                  Round
                  <select value={stage.round} onChange={(event) => handleStageChange(index, "round", event.target.value)}>
                    {interviewRoundOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Date
                  <input type="date" value={stage.date} onChange={(event) => handleStageChange(index, "date", event.target.value)} />
                </label>
                <label>
                  Result
                  <select value={stage.result} onChange={(event) => handleStageChange(index, "result", event.target.value)}>
                    {interviewResultOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="field-span-2">
                  Notes
                  <textarea rows="2" value={stage.notes} onChange={(event) => handleStageChange(index, "notes", event.target.value)} />
                </label>
              </div>
              <button type="button" className="ghost-button danger-button" onClick={() => removeStage(index)}>
                Remove stage
              </button>
            </div>
          ))}
        </div>

        <button type="submit" className="primary-button" disabled={saving}>
          {saving ? "Saving..." : initialValues?._id ? "Update application" : "Create application"}
        </button>
      </form>
    </section>
  );
};

export default ApplicationForm;
