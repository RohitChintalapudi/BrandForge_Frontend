import { useEffect, useState, useMemo, useCallback } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import Confetti from "react-confetti";
import { useAuth } from "../context/AuthContext";
import {
  getCampaignIdFromRef,
  totalWonSummary,
} from "../utils/creatorPrizes";

const CreatorDashboard = () => {
  const { user } = useAuth();

  const [campaigns, setCampaigns] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [wins, setWins] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [contentUrl, setContentUrl] = useState("");
  const [touchedUrl, setTouchedUrl] = useState(false);
  const [urlError, setUrlError] = useState("");
  const [isSubmittingPitch, setIsSubmittingPitch] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search and Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // "all" | "open" | "submitted" | "wins"
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [campaignsRes, submissionsRes, winsRes] = await Promise.allSettled([
          api.get("/api/campaigns"),
          api.get("/api/submissions/mine"),
          api.get("/api/submissions/my-wins"),
        ]);

        if (campaignsRes.status === "fulfilled") setCampaigns(campaignsRes.value.data || []);
        if (submissionsRes.status === "fulfilled") setMySubmissions(submissionsRes.value.data || []);
        if (winsRes.status === "fulfilled") setWins(winsRes.value.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const hasSubmitted = useCallback(
    (campaignId) =>
      mySubmissions.some(
        (s) => getCampaignIdFromRef(s.campaign) === String(campaignId)
      ),
    [mySubmissions]
  );

  const getSubmissionForCampaign = useCallback(
    (campaignId) =>
      mySubmissions.find(
        (s) => getCampaignIdFromRef(s.campaign) === String(campaignId)
      ),
    [mySubmissions]
  );

  const hasWon = useCallback(
    (campaignId) =>
      wins.some(
        (w) =>
          getCampaignIdFromRef(w.campaign ?? w.campaignId) ===
          String(campaignId)
      ),
    [wins]
  );

  const formatDeadline = (value) => {
    if (!value) return "No deadline specified";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const validateUrl = (val) => {
    const trimmed = (val || "").trim();
    if (!trimmed) {
      return "Media or Drive URL is required.";
    }
    if (!/^https?:\/\//i.test(trimmed)) {
      return "URL must begin with http:// or https://";
    }
    try {
      const parsed = new URL(trimmed);
      if (!parsed.hostname || !parsed.hostname.includes(".")) {
        return "Please enter a valid web domain address.";
      }
    } catch {
      return "Please enter a valid URL (e.g., https://drive.google.com/...)";
    }
    return "";
  };

  const detectPlatformBadge = (url) => {
    const s = (url || "").toLowerCase();
    if (s.includes("drive.google.com")) return "📁 Google Drive";
    if (s.includes("dropbox.com")) return "📦 Dropbox";
    if (s.includes("youtube.com") || s.includes("youtu.be")) return "🎥 YouTube";
    if (s.includes("instagram.com")) return "📸 Instagram";
    if (s.includes("tiktok.com")) return "🎵 TikTok";
    if (s.includes("loom.com")) return "🎬 Loom";
    if (s.includes("vimeo.com")) return "📽️ Vimeo";
    if (s.includes("onedrive") || s.includes("1drv.ms")) return "☁️ OneDrive";
    if (/^https?:\/\//i.test(s)) return "🔗 Public Web Link";
    return null;
  };

  const handleUrlChange = (val) => {
    setContentUrl(val);
    if (touchedUrl) {
      setUrlError(validateUrl(val));
    }
  };

  const closeModal = () => {
    setSelectedCampaign(null);
    setContentUrl("");
    setTouchedUrl(false);
    setUrlError("");
    setIsSubmittingPitch(false);
  };

  const submitContent = async (e) => {
    e.preventDefault();
    if (isSubmittingPitch) return;

    setTouchedUrl(true);
    const err = validateUrl(contentUrl);
    setUrlError(err);

    if (err) {
      toast.error(err);
      return;
    }

    setIsSubmittingPitch(true);
    try {
      await api.post("/api/submissions", {
        campaignId: selectedCampaign._id,
        contentUrl: contentUrl.trim(),
      });

      toast.success("Pitch submitted successfully! 🚀");
      closeModal();

      const res = await api.get("/api/submissions/mine");
      setMySubmissions(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    } finally {
      setIsSubmittingPitch(false);
    }
  };

  const triggerCelebration = () => {
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  // Metrics
  const approvedCampaigns = useMemo(
    () => campaigns.filter((c) => c.status === "approved"),
    [campaigns]
  );

  const openOpportunitiesCount = useMemo(
    () => approvedCampaigns.filter((c) => !hasSubmitted(c._id)).length,
    [approvedCampaigns, hasSubmitted]
  );

  const totalEarningsWon = useMemo(
    () => totalWonSummary(wins, campaigns) || "₹0",
    [wins, campaigns]
  );

  // Filtered List
  const filteredCampaigns = useMemo(() => {
    return approvedCampaigns.filter((c) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.title?.toLowerCase().includes(q) ||
        c.description?.toLowerCase().includes(q) ||
        c.reward?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === "open") return !hasSubmitted(c._id);
      if (activeFilter === "submitted") return hasSubmitted(c._id);
      if (activeFilter === "wins") return hasWon(c._id);
      return true;
    });
  }, [approvedCampaigns, searchQuery, activeFilter, hasSubmitted, hasWon]);

  return (
    <div className="brand-dashboard-layout">
      {showConfetti && <Confetti recycle={false} numberOfPieces={350} />}

      {/* Ambient background lighting */}
      <div className="ambient-glow glow-top-left"></div>
      <div className="ambient-glow glow-bottom-right"></div>
      <div className="ambient-mesh-pattern"></div>

      <div className="dashboard-main-container">
        {/* Welcome Banner */}
        <div className="dashboard-welcome-banner">
          <div className="welcome-text-group">
            <div className="brand-role-chip" style={{ background: "rgba(139, 92, 246, 0.14)", borderColor: "rgba(139, 92, 246, 0.3)" }}>
              <span>🎨 Creator Growth & Pitch Portal</span>
            </div>
            <h1>Welcome back, {user?.name || "Creator"} 👋</h1>
            <p>
              Discover active brand opportunities, pitch your creative video concepts, track submission statuses, and celebrate winning rewards.
            </p>
          </div>

          <div className="welcome-actions">
            {wins.length > 0 ? (
              <button
                type="button"
                className="create-campaign-btn"
                style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)" }}
                onClick={triggerCelebration}
              >
                <span>🏆 Celebrate Wins ({wins.length})</span>
              </button>
            ) : (
              <button
                type="button"
                className="create-campaign-btn"
                onClick={() => setActiveFilter("open")}
              >
                <span>Browse Opportunities 🚀</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="metrics-dashboard-grid">
          <div className="metric-stat-card stat-approved">
            <div className="metric-stat-header">
              <span className="metric-stat-label">Open Opportunities</span>
              <span className="metric-stat-badge badge-green">Live</span>
            </div>
            <div className="metric-stat-value">{openOpportunitiesCount}</div>
            <div className="metric-stat-footer">
              <span>Ready for your pitch</span>
            </div>
          </div>

          <div className="metric-stat-card">
            <div className="metric-stat-header">
              <span className="metric-stat-label">Pitches Submitted</span>
              <span className="metric-stat-badge">Total</span>
            </div>
            <div className="metric-stat-value">{mySubmissions.length}</div>
            <div className="metric-stat-footer">
              <span>Collaborations in pipeline</span>
            </div>
          </div>

          <div className="metric-stat-card stat-pending" style={{ borderColor: wins.length > 0 ? "#fbbf24" : undefined }}>
            <div className="metric-stat-header">
              <span className="metric-stat-label">Crowned Wins</span>
              <span className="metric-stat-badge badge-amber">🏆 Wins</span>
            </div>
            <div className="metric-stat-value" style={{ color: wins.length > 0 ? "#b45309" : undefined }}>
              {wins.length}
            </div>
            <div className="metric-stat-footer">
              <span>Winning campaigns awarded</span>
            </div>
          </div>

          <div className="metric-stat-card stat-action" style={{ background: "linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(245, 158, 11, 0.08))" }}>
            <div className="metric-stat-header">
              <span className="metric-stat-label">Total Earnings</span>
              <span className="metric-stat-badge">💎 Rewards</span>
            </div>
            <div className="metric-stat-value" style={{ fontSize: "1.5rem", color: "var(--purple-dark)" }}>
              {totalEarningsWon}
            </div>
            <div className="metric-stat-footer">
              <span>All-time creator payouts</span>
            </div>
          </div>
        </div>

        {/* Wins Spotlight Banner if creator has wins */}
        {wins.length > 0 && (
          <div className="winner-spotlight-card" style={{ marginBottom: "1.5rem" }}>
            <div className="spotlight-left">
              <div className="trophy-badge">🏆</div>
              <div>
                <span className="winner-tag">⭐ Top Creator Accolade</span>
                <h2 className="winner-creator-name">You have won {wins.length} brand campaign{wins.length > 1 ? "s" : ""}!</h2>
                <p className="winner-subtitle">
                  Total awarded earnings: <strong>{totalEarningsWon}</strong>. Keep pitching high quality content to win more campaigns!
                </p>
              </div>
            </div>
            <div className="spotlight-actions">
              <button
                type="button"
                className="celebrate-btn"
                onClick={triggerCelebration}
              >
                🎉 Confetti Burst
              </button>
            </div>
          </div>
        )}

        {/* Campaign Explorer Header & Filter Tabs */}
        <div className="campaigns-explorer-header">
          <div className="explorer-title-group">
            <h2>Brand Campaigns</h2>
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
                placeholder="Search campaigns, brands, rewards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Tabs */}
            <div className="filter-pill-group">
              <button
                type="button"
                className={`filter-pill ${activeFilter === "all" ? "active" : ""}`}
                onClick={() => setActiveFilter("all")}
              >
                All Opportunities
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === "open" ? "active" : ""}`}
                onClick={() => setActiveFilter("open")}
              >
                Open to Pitch ({openOpportunitiesCount})
              </button>
              <button
                type="button"
                className={`filter-pill ${activeFilter === "submitted" ? "active" : ""}`}
                onClick={() => setActiveFilter("submitted")}
              >
                My Pitches ({mySubmissions.length})
              </button>
              {wins.length > 0 && (
                <button
                  type="button"
                  className={`filter-pill ${activeFilter === "wins" ? "active" : ""}`}
                  onClick={() => setActiveFilter("wins")}
                >
                  🏆 Won ({wins.length})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="empty-campaigns-box">
            <span className="btn-spinner" style={{ width: "32px", height: "32px", borderColor: "rgba(139,92,246,0.3)", borderTopColor: "var(--purple)", margin: "0 auto 1rem auto" }}></span>
            <h3>Loading available campaigns...</h3>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="empty-campaigns-box">
            <div className="empty-icon">🎨</div>
            <h3>No campaigns found</h3>
            <p>
              {searchQuery || activeFilter !== "all"
                ? "Try clearing your search query or switching to another filter."
                : "There are currently no active campaigns open. Check back soon for new opportunities!"}
            </p>
            {(searchQuery || activeFilter !== "all") && (
              <button
                type="button"
                className="create-campaign-btn"
                style={{ marginTop: "1rem" }}
                onClick={() => {
                  setSearchQuery("");
                  setActiveFilter("all");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="brand-campaigns-grid">
            {filteredCampaigns.map((c) => {
              const won = hasWon(c._id);
              const submitted = hasSubmitted(c._id);
              const submissionObj = getSubmissionForCampaign(c._id);

              return (
                <div
                  className={`brand-campaign-card ${won ? "card-winner-highlight" : ""}`}
                  key={c._id}
                >
                  <div className="card-top-row">
                    {won ? (
                      <span className="status-chip" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#b45309", border: "1px solid rgba(245, 158, 11, 0.35)" }}>
                        <span>🏆</span> Winner Crowned
                      </span>
                    ) : submitted ? (
                      <span className="status-chip chip-approved" style={{ background: "rgba(139, 92, 246, 0.12)", color: "var(--purple-dark)", borderColor: "rgba(139, 92, 246, 0.25)" }}>
                        <span className="status-dot"></span> Pitch Submitted
                      </span>
                    ) : (
                      <span className="status-chip chip-approved">
                        <span className="status-dot"></span> Open for Pitches
                      </span>
                    )}

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
                        <span>{formatDeadline(c.deadline)}</span>
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

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <button
                        type="button"
                        className="back-nav-btn"
                        style={{ padding: "0.48rem 0.85rem", fontSize: "0.82rem" }}
                        onClick={() => setViewCampaign(c)}
                      >
                        Brief 📋
                      </button>

                      {submitted ? (
                        submissionObj?.contentUrl ? (
                          <a
                            href={submissionObj.contentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="manage-submissions-btn"
                            style={{ padding: "0.48rem 0.85rem", fontSize: "0.82rem", background: "linear-gradient(135deg, #10b981, #059669)" }}
                          >
                            <span>View Link ↗</span>
                          </a>
                        ) : (
                          <span
                            className="status-chip chip-approved"
                            style={{ padding: "0.48rem 0.75rem" }}
                          >
                            ✓ Sent
                          </span>
                        )
                      ) : (
                        <button
                          type="button"
                          className="manage-submissions-btn"
                          style={{ padding: "0.48rem 0.95rem", fontSize: "0.82rem" }}
                          onClick={() => setSelectedCampaign(c)}
                        >
                          <span>Pitch 🚀</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CAMPAIGN BRIEF INSPECTOR MODAL */}
      {viewCampaign && (
        <div
          className="create-modal-backdrop"
          onClick={() => setViewCampaign(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="create-modal-card"
            style={{ maxWidth: "560px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <span className="modal-badge">Campaign Brief</span>
                <h2>{viewCampaign.title || "Campaign Guidelines"}</h2>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setViewCampaign(null)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-field modal-full-span" style={{ marginTop: "0.5rem" }}>
              <label style={{ fontSize: "0.82rem", color: "var(--purple-dark)", fontWeight: 700 }}>
                CAMPAIGN OBJECTIVE & BRIEF
              </label>
              <div style={{
                background: "#f8fafc",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "1rem 1.1rem",
                fontSize: "0.92rem",
                lineHeight: "1.6",
                color: "var(--text)",
                whiteSpace: "pre-line",
                maxHeight: "220px",
                overflowY: "auto"
              }}>
                {viewCampaign.description || "No description provided by the brand."}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ background: "rgba(139, 92, 246, 0.08)", border: "1px solid rgba(139, 92, 246, 0.18)", borderRadius: "12px", padding: "0.85rem 1rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--purple-dark)", textTransform: "uppercase" }}>
                  REWARD POOL
                </span>
                <div style={{ fontSize: "1.3rem", fontWeight: 800, color: "var(--purple-dark)", marginTop: "0.2rem" }}>
                  {viewCampaign.reward || "₹0"}
                </div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid var(--border)", borderRadius: "12px", padding: "0.85rem 1rem" }}>
                <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--text-light)", textTransform: "uppercase" }}>
                  SUBMISSION DEADLINE
                </span>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--text)", marginTop: "0.2rem" }}>
                  {formatDeadline(viewCampaign.deadline)}
                </div>
              </div>
            </div>

            <div className="instruction-box" style={{ marginTop: "1.2rem", borderRadius: "12px" }}>
              <strong style={{ color: "var(--purple-dark)", fontSize: "0.85rem" }}>
                Deliverable Guidelines:
              </strong>
              <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.82rem" }}>
                <li>Minimum 1080p Full HD resolution video.</li>
                <li>Clear lighting and clean audio with minimal noise.</li>
                <li>Ensure public link sharing permissions are enabled.</li>
              </ul>
            </div>

            <div className="modal-action-bar" style={{ marginTop: "1.4rem" }}>
              <button
                type="button"
                className="modal-cancel-btn"
                onClick={() => setViewCampaign(null)}
              >
                Close Brief
              </button>

              {!hasSubmitted(viewCampaign._id) && (
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={() => {
                    const c = viewCampaign;
                    setViewCampaign(null);
                    setSelectedCampaign(c);
                  }}
                >
                  <span>Submit Pitch Now 🚀</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUBMIT PITCH MODAL */}
      {selectedCampaign && (
        <div
          className="create-modal-backdrop"
          onClick={() => !isSubmittingPitch && closeModal()}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="create-modal-card"
            style={{ maxWidth: "520px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-top-bar">
              <div className="modal-title-group">
                <span className="modal-badge">Pitch Submission</span>
                <h2>Submit Pitch for {selectedCampaign.title}</h2>
              </div>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => !isSubmittingPitch && closeModal()}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form className="modal-form" onSubmit={submitContent} noValidate>
              <div className="modal-field modal-full-span">
                <label htmlFor="pitch-url-input">Public Media / Google Drive URL</label>
                <input
                  id="pitch-url-input"
                  type="url"
                  placeholder="e.g. https://drive.google.com/file/d/... or YouTube link"
                  value={contentUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  onBlur={() => {
                    setTouchedUrl(true);
                    setUrlError(validateUrl(contentUrl));
                  }}
                  className={touchedUrl && urlError ? "input-has-error" : ""}
                  autoFocus
                />

                {touchedUrl && urlError && (
                  <div className="form-error-msg">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>{urlError}</span>
                  </div>
                )}

                {!urlError && contentUrl && detectPlatformBadge(contentUrl) && (
                  <div className="url-preview-badge">
                    <span>{detectPlatformBadge(contentUrl)}</span>
                  </div>
                )}
              </div>

              <div className="instruction-box" style={{ marginTop: "1rem", borderRadius: "12px" }}>
                <strong style={{ color: "var(--purple-dark)", fontSize: "0.85rem" }}>
                  Before Submitting:
                </strong>
                <ul style={{ margin: "0.4rem 0 0", paddingLeft: "1.2rem", fontSize: "0.82rem" }}>
                  <li>Video quality should be at least 1080p (Full HD).</li>
                  <li>Confirm Drive / Media link access is set to <strong>Anyone with link can view</strong>.</li>
                  <li>Ensure deliverable aligns with brand brief criteria.</li>
                </ul>
              </div>

              <div className="modal-action-bar" style={{ marginTop: "1.4rem" }}>
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={closeModal}
                  disabled={isSubmittingPitch}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="modal-submit-btn"
                  disabled={isSubmittingPitch}
                >
                  {isSubmittingPitch ? (
                    <div className="btn-spinner-row">
                      <span className="btn-spinner"></span>
                      <span>Submitting Pitch...</span>
                    </div>
                  ) : (
                    <span>Submit Pitch 🚀</span>
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

export default CreatorDashboard;
