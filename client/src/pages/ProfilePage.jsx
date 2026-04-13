import { useEffect, useRef, useState } from "react";
import apiClient from "../api/apiClient";
import { useAuth } from "../hooks/useAuth";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
    resumeUrl: "",
    weeklyDigestEnabled: true
  });
  const [resumeFile, setResumeFile] = useState(null);
  // Bug #2 / #10: Separate success and error messages with auto-clear on success
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const successTimerRef = useRef(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      skills: (user.skills || []).join(", "),
      resumeUrl: user.resumeUrl || "",
      weeklyDigestEnabled: user.weeklyDigestEnabled ?? true
    });
  }, [user]);

  // Clean up the auto-clear timer on unmount
  useEffect(() => {
    return () => {
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
    };
  }, []);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const payload = new FormData();
      Object.entries(formData).forEach(([key, value]) => payload.append(key, value));

      if (resumeFile) {
        payload.append("resume", resumeFile);
      }

      const response = await apiClient.put("/profile", payload, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      updateUser(response.data.user);
      setResumeFile(null);
      setSuccessMessage("Profile saved successfully.");

      // Bug #10: Auto-clear the success banner after 4 seconds
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      successTimerRef.current = setTimeout(() => setSuccessMessage(""), 4000);
    } catch (error) {
      // Bug #2: Catch block now correctly surfaces API errors to the user
      setErrorMessage(error.response?.data?.message || "Could not save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-stack">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">Profile</p>
          <h2>Keep your application materials ready</h2>
          <p>Update contact details, skills, resume, and digest preferences from one screen.</p>
        </div>
      </section>

      <section className="panel form-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Your profile</p>
            <h2>Personal details and assets</h2>
          </div>
        </div>

        <form className="application-form" onSubmit={handleSubmit}>
          <div className="field-grid">
            <label>
              Name
              <input name="name" value={formData.name} onChange={handleChange} required />
            </label>
            <label>
              Email
              <input type="email" name="email" value={formData.email} onChange={handleChange} required />
            </label>
            <label>
              Phone
              <input name="phone" value={formData.phone} onChange={handleChange} />
            </label>
            <label>
              Skills
              <input name="skills" value={formData.skills} onChange={handleChange} placeholder="React, Node.js, MongoDB" />
            </label>
            <label className="field-span-2">
              Resume link
              <input name="resumeUrl" value={formData.resumeUrl} onChange={handleChange} placeholder="https://drive.google.com/..." />
            </label>
            <label className="field-span-2">
              Resume upload
              <input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeFile(event.target.files?.[0] || null)} />
            </label>
            <label className="checkbox-row field-span-2">
              <input type="checkbox" name="weeklyDigestEnabled" checked={formData.weeklyDigestEnabled} onChange={handleChange} />
              Receive weekly reminder digests
            </label>
          </div>

          <button type="submit" className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save profile"}
          </button>
        </form>

        {successMessage ? <p className="success-text">{successMessage}</p> : null}
        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}
      </section>
    </div>
  );
};

export default ProfilePage;
