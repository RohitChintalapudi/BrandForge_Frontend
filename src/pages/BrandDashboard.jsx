import { useEffect, useState } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { useAuth } from "../context/AuthContext";

const BrandDashboard = () => {
  const { user } = useAuth();

  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
    deadline: "",
  });
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const minDeadlineDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  const fetchCampaigns = async () => {
    try {
      const res = await api.get("/api/campaigns");
      setCampaigns(res.data || []);
    } catch {
      toast.error("Failed to load campaigns");
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const validateField = (name, value) => {
    let errorMsg = "";
    if (name === "title") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errorMsg = "Campaign title is required.";
      } else if (trimmed.length < 5) {
        errorMsg = "Title must be at least 5 characters long.";
      } else if (trimmed.length > 100) {
        errorMsg = "Title cannot exceed 100 characters.";
      }
    } else if (name === "reward") {
      const trimmed = (value || "").toString().trim();
      const numericVal = parseInt(trimmed.replace(/[^0-9]/g, ""), 10);
      if (!trimmed) {
        errorMsg = "Reward pool amount is required.";
      } else if (isNaN(numericVal) || numericVal < 500) {
        errorMsg = "Minimum reward budget is ₹500 (e.g. ₹5,000).";
      }
    } else if (name === "deadline") {
      if (!value) {
        errorMsg = "Submission deadline is required.";
      } else {
        const selectedDate = new Date(value);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (isNaN(selectedDate.getTime()) || selectedDate <= today) {
          errorMsg = "Deadline must be a future date (tomorrow or later).";
        }
      }
    } else if (name === "description") {
      const trimmed = (value || "").trim();
      if (!trimmed) {
        errorMsg = "Campaign description is required.";
      } else if (trimmed.length < 20) {
        errorMsg = "Description must be at least 20 characters detailing the brief.";
      } else if (trimmed.length > 2000) {
        errorMsg = "Description cannot exceed 2000 characters.";
      }
    }
    return errorMsg;
  };

  const handleFormFieldChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (touched[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value, updated),
      }));
    }
  };

  const handleFieldBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({
      ...prev,
      [field]: validateField(field, form[field], form),
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (isCreating) return;

    const titleErr = validateField("title", form.title);
    const rewardErr = validateField("reward", form.reward);
    const deadlineErr = validateField("deadline", form.deadline);
    const descErr = validateField("description", form.description);

    setTouched({
      title: true,
      reward: true,
      deadline: true,
      description: true,
    });
    setErrors({
      title: titleErr,
      reward: rewardErr,
      deadline: deadlineErr,
      description: descErr,
    });

    if (titleErr || rewardErr || deadlineErr || descErr) {
      toast.error("Please fill in all campaign fields correctly.");
      return;
    }

    setIsCreating(true);
    try {
      await api.post("/api/campaigns", {
        title: form.title.trim(),
        description: form.description.trim(),
        reward: form.reward.trim(),
        deadline: form.deadline,
      });
      toast.success("Campaign created successfully! (Pending admin review) 🚀");
      setForm({ title: "", description: "", reward: "", deadline: "" });
      setTouched({});
      setErrors({});
      setShowCreateModal(false);
      fetchCampaigns();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create campaign");
    } finally {
      setIsCreating(false);
    }
  };

  const openSubmissions = async (campaign) => {
    setSelectedCampaign(campaign);
    setWinner(null);
    setShowWinner(false);
    setShowConfetti(false);

    try {
      const res = await api.get(`/api/submissions/campaign/${campaign._id}`);
      setSubmissions(res.data || []);

      const winning = res.data?.find((s) => s.status === "winner");
      if (winning) {
        setWinner(winning);
        setShowWinner(true);
      }
    } catch {
      toast.error("Failed to load submissions for this campaign");
    }
  };

  const selectWinner = async (id) => {
    try {
      await api.put(`/api/submissions/${id}/winner`);
      toast.success("🏆 Winner crowned successfully!");

      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: "winner" } : s))
      );

      const selected = submissions.find((s) => s._id === id);
      if (selected) {
        setWinner({ ...selected, status: "winner" });
        setShowWinner(true);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 6000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to select winner");
    }
  };

  const triggerConfettiCelebration = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const addPromptTag = (tagText) => {
    setForm((prev) => ({
      ...prev,
      description: prev.description
        ? `${prev.description}\n• ${tagText}`
        : `• ${tagText}`,
    }));
  };

  // Metrics calculation
  const totalCampaigns = campaigns.length;
  const approvedCampaigns = campaigns.filter((c) => c.status === "approved").length;
  const pendingCampaigns = campaigns.filter((c) => c.status === "pending").length;

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    if (!c || !c._id) return false;
    const matchesSearch =
      c.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="brand-dashboard-layout">
      {showConfetti && <Confetti recycle={false} numberOfPieces={350} />}

      {/* Ambient background glows */}
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-bottom-right"></div>
      <div className="ambient-mesh-pattern"></div>

      <div className="dashboard-main-container">
        {/* Main Dashboard Overview (When no single campaign is selected) */}
        {!selectedCampaign && (
          <>
            {/* Header & Action Bar */}
            <div className="dashboard-welcome-banner">
              <div className="welcome-text-group">
                <div className="brand-role-chip">
                  <span>🏢 Brand Management Portal</span>
                </div>
                <h1>Welcome back, {user?.name || "Brand Partner"} 👋</h1>
                <p>
                  Create high-impact creator campaigns, monitor submissions, and
                  reward top talent.
                </p>
              </div>

              <div className="welcome-actions">
                <button
                  type="button"
                  className="create-campaign-btn"
                  onClick={() => setShowCreateModal(true)}
                >
                  <span className="btn-plus-icon">+</span>
                  <span>Create Campaign</span>
                </button>
              </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="metrics-dashboard-grid">
              <div className="metric-stat-card">
                <div className="metric-stat-header">
                  <span className="metric-stat-label">Total Campaigns</span>
                  <span className="metric-stat-badge">All-time</span>
                </div>
                <div className="metric-stat-value">{totalCampaigns}</div>
                <div className="metric-stat-footer">
                  <span>Active campaign portfolio</span>
                </div>
              </div>

              <div className="metric-stat-card stat-approved">
                <div className="metric-stat-header">
                  <span className="metric-stat-label">Live & Approved</span>
                  <span className="metric-stat-badge badge-green">Live</span>
                </div>
                <div className="metric-stat-value">{approvedCampaigns}</div>
                <div className="metric-stat-footer">
                  <span>Open for creator submissions</span>
                </div>
              </div>

              <div className="metric-stat-card stat-pending">
                <div className="metric-stat-header">
                  <span className="metric-stat-label">Pending Review</span>
                  <span className="metric-stat-badge badge-amber">Review</span>
                </div>
                <div className="metric-stat-value">{pendingCampaigns}</div>
                <div className="metric-stat-footer">
                  <span>Awaiting admin verification</span>
                </div>
              </div>

              <div className="metric-stat-card stat-action">
                <div className="metric-stat-header">
                  <span className="metric-stat-label">Instant Action</span>
                  <span className="metric-stat-badge">Quick</span>
                </div>
                <p className="quick-action-hint">Launch a new campaign in seconds</p>
                <button
                  type="button"
                  className="quick-action-link"
                  onClick={() => setShowCreateModal(true)}
                >
                  Launch Now →
                </button>
              </div>
            </div>

            {/* Campaign Explorer Header & Filters */}
            <div className="campaigns-explorer-header">
              <div className="explorer-title-group">
                <h2>Your Campaigns</h2>
                <span className="count-pill">{filteredCampaigns.length}</span>
              </div>

              <div className="explorer-controls">
                {/* Search Bar */}
                <div className="search-input-box">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search campaigns..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {/* Filter Tabs */}
                <div className="filter-pill-group">
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "all" ? "active" : ""}`}
                    onClick={() => setStatusFilter("all")}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "approved" ? "active" : ""}`}
                    onClick={() => setStatusFilter("approved")}
                  >
                    Approved
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${statusFilter === "pending" ? "active" : ""}`}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Pending
                  </button>
                </div>
              </div>
            </div>

            {/* Campaigns Grid */}
            {filteredCampaigns.length === 0 ? (
              <div className="empty-campaigns-box">
                <div className="empty-icon">📢</div>
                <h3>No campaigns found</h3>
                <p>
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your search query or status filter."
                    : "You haven't created any campaigns yet. Start engaging creators today!"}
                </p>
                <button
                  type="button"
                  className="create-campaign-btn"
                  onClick={() => setShowCreateModal(true)}
                  style={{ marginTop: "1rem" }}
                >
                  + Create Your First Campaign
                </button>
              </div>
            ) : (
              <div className="brand-campaigns-grid">
                {filteredCampaigns.map((c) => (
                  <div className="brand-campaign-card" key={c._id}>
                    <div className="card-top-row">
                      <span
                        className={`status-chip ${
                          c.status === "approved" ? "chip-approved" : "chip-pending"
                        }`}
                      >
                        <span className="status-dot"></span>
                        {c.status === "approved" ? "Approved & Live" : "Pending Approval"}
                      </span>

                      {c.deadline && (
                        <div className="deadline-tag">
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                            <line x1="16" x2="16" y1="2" y2="6" />
                            <line x1="8" x2="8" y1="2" y2="6" />
                            <line x1="3" x2="21" y1="10" y2="10" />
                          </svg>
                          <span>{new Date(c.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    <h3 className="campaign-card-title">{c.title}</h3>
                    <p className="campaign-card-desc">{c.description}</p>

                    <div className="card-bottom-bar">
                      <div className="reward-badge-group">
                        <span className="reward-label">Reward Pool</span>
                        <span className="reward-amount">{c.reward || "₹0"}</span>
                      </div>

                      <button
                        type="button"
                        className="manage-submissions-btn"
                        onClick={() => openSubmissions(c)}
                      >
                        <span>Submissions</span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M5 12h14" />
                          <path d="m12 5 7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Selected Campaign Submissions View */}
        {selectedCampaign && (
          <div className="submissions-view-container">
            {/* Header Navigation & Breadcrumb */}
            <div className="submissions-header-bar">
              <button
                type="button"
                className="back-nav-btn"
                onClick={() => {
                  setSelectedCampaign(null);
                  setShowWinner(false);
                  setShowConfetti(false);
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
                <span>Back to All Campaigns</span>
              </button>

              <div className="campaign-context-badge">
                <span className="campaign-context-title">
                  {selectedCampaign.title}
                </span>
                <span className="context-reward-chip">
                  Reward: {selectedCampaign.reward}
                </span>
              </div>
            </div>

            {/* Winner Spotlight Banner */}
            {winner && showWinner && (
              <div className="winner-spotlight-card">
                <div className="spotlight-left">
                  <div className="trophy-badge">🏆</div>
                  <div>
                    <span className="winner-tag">Official Winner Crowned</span>
                    <h2 className="winner-creator-name">
                      {winner.creator?.name || "Talented Creator"}
                    </h2>
                    <p className="winner-subtitle">
                      Awarded for top content submission on this campaign.
                    </p>
                  </div>
                </div>

                <div className="spotlight-actions">
                  <a
                    href={winner.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="view-winning-content-btn"
                  >
                    <span>View Winning Content ↗</span>
                  </a>
                  <button
                    type="button"
                    className="celebrate-btn"
                    onClick={triggerConfettiCelebration}
                  >
                    Celebrate 🎉
                  </button>
                </div>
              </div>
            )}

            {/* Submissions Section Header */}
            <div className="submissions-section-header">
              <div>
                <h2>Creator Submissions ({submissions.length})</h2>
                <p>Review uploaded videos and select the winning creator</p>
              </div>

              {winner && !showWinner && (
                <button
                  type="button"
                  className="view-winner-toggle-btn"
                  onClick={() => {
                    setShowWinner(true);
                    triggerConfettiCelebration();
                  }}
                >
                  🏆 View Crowned Winner
                </button>
              )}
            </div>

            {/* Submissions Grid */}
            {submissions.length === 0 ? (
              <div className="empty-submissions-box">
                <div className="empty-icon">⏳</div>
                <h3>No Submissions Yet</h3>
                <p>
                  Creators are currently crafting content for this campaign. Check
                  back soon!
                </p>
              </div>
            ) : (
              <div className="submissions-grid">
                {submissions.map((s, index) => {
                  const isWinning = s.status === "winner";

                  return (
                    <div
                      className={`submission-card ${isWinning ? "card-winner-highlight" : ""}`}
                      key={s._id}
                    >
                      <div className="submission-card-header">
                        <div className="creator-profile-badge">
                          <div className="creator-avatar-circle">
                            {s.creator?.name
                              ? s.creator.name.charAt(0).toUpperCase()
                              : `#${index + 1}`}
                          </div>
                          <div>
                            <strong className="creator-name">
                              {s.creator?.name || "Anonymous Creator"}
                            </strong>
                            <span className="creator-email">
                              {s.creator?.email || "Verified Creator"}
                            </span>
                          </div>
                        </div>

                        {isWinning && (
                          <span className="winner-ribbon">🏆 Winner</span>
                        )}
                      </div>

                      <div className="submission-content-preview">
                        <a
                          href={s.contentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="content-url-pill"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                          </svg>
                          <span className="url-truncate">{s.contentUrl}</span>
                          <span className="open-icon">↗</span>
                        </a>
                      </div>

                      <div className="submission-card-footer">
                        {isWinning ? (
                          <div className="winner-confirmed-pill">
                            <span>Selected Winner</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="select-winner-btn"
                            onClick={() => selectWinner(s._id)}
                          >
                            <span>Award Winner 🏆</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal: Create Campaign Drawer */}
      {showCreateModal && (
        <div
          className="create-modal-backdrop"
          onClick={() => !isCreating && setShowCreateModal(false)}
        >
          <div
            className="create-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <span className="modal-badge">New Launch</span>
                <h2>Create Creator Campaign</h2>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => !isCreating && setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>

            <form className="modal-form" onSubmit={handleCreate} noValidate>
              <div className="modal-form-grid">
                {/* Title */}
                <div className="modal-field">
                  <label htmlFor="modal-campaign-title">Campaign Title</label>
                  <input
                    id="modal-campaign-title"
                    placeholder="e.g. Summer Fitness Reel Showcase"
                    value={form.title}
                    onChange={(e) => handleFormFieldChange("title", e.target.value)}
                    onBlur={() => handleFieldBlur("title")}
                    className={touched.title && errors.title ? "input-has-error" : ""}
                  />
                  {touched.title && errors.title && (
                    <div className="form-error-msg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{errors.title}</span>
                    </div>
                  )}
                </div>

                {/* Reward */}
                <div className="modal-field">
                  <label htmlFor="modal-campaign-reward">Reward Pool (INR / ₹)</label>
                  <input
                    id="modal-campaign-reward"
                    placeholder="e.g. ₹15,000"
                    value={form.reward}
                    onChange={(e) => handleFormFieldChange("reward", e.target.value)}
                    onBlur={() => handleFieldBlur("reward")}
                    className={touched.reward && errors.reward ? "input-has-error" : ""}
                  />
                  {touched.reward && errors.reward && (
                    <div className="form-error-msg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{errors.reward}</span>
                    </div>
                  )}
                </div>

                {/* Deadline */}
                <div className="modal-field modal-full-span">
                  <label htmlFor="modal-campaign-deadline">Submission Deadline</label>
                  <input
                    id="modal-campaign-deadline"
                    type="date"
                    min={minDeadlineDate}
                    value={form.deadline}
                    onChange={(e) => handleFormFieldChange("deadline", e.target.value)}
                    onBlur={() => handleFieldBlur("deadline")}
                    className={touched.deadline && errors.deadline ? "input-has-error" : ""}
                  />
                  {touched.deadline && errors.deadline && (
                    <div className="form-error-msg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      <span>{errors.deadline}</span>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="modal-field modal-full-span">
                  <div className="label-with-tags">
                    <label htmlFor="modal-campaign-desc">Campaign Description & Guidelines</label>
                    <span className="tag-hint">Click to append requirements:</span>
                  </div>

                  {/* Quick Tag Helper Chips */}
                  <div className="tag-chips-row">
                    <button
                      type="button"
                      className="tag-chip"
                      onClick={() => addPromptTag("9:16 Vertical Video format (Instagram Reel/TikTok)")}
                    >
                      + 9:16 Reel
                    </button>
                    <button
                      type="button"
                      className="tag-chip"
                      onClick={() => addPromptTag("Mention @BrandForge in caption")}
                    >
                      + Mention Brand
                    </button>
                    <button
                      type="button"
                      className="tag-chip"
                      onClick={() => addPromptTag("Min 30 seconds high-res 1080p")}
                    >
                      + 1080p Quality
                    </button>
                  </div>

                  <textarea
                    id="modal-campaign-desc"
                    placeholder="Describe your goals, brand talking points, guidelines, and what you're looking for (min 20 characters)..."
                    value={form.description}
                    onChange={(e) => handleFormFieldChange("description", e.target.value)}
                    onBlur={() => handleFieldBlur("description")}
                    className={touched.description && errors.description ? "input-has-error" : ""}
                    rows="4"
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.25rem" }}>
                    {touched.description && errors.description ? (
                      <div className="form-error-msg" style={{ marginTop: 0 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span>{errors.description}</span>
                      </div>
                    ) : <span />}
                    <span className={`char-counter ${form.description.length > 1900 ? "limit-near" : ""}`}>
                      {form.description.length}/2000 characters
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-action-bar">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isCreating}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <div className="btn-spinner-row">
                      <span className="btn-spinner"></span>
                      <span>Publishing Campaign...</span>
                    </div>
                  ) : (
                    <span>Publish Campaign 🚀</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrandDashboard;

