import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import {
  getCampaignIdFromRef,
  prizeForWin,
  titleForWin,
} from "../utils/creatorPrizes";

const CreatorDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [wins, setWins] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [viewCampaign, setViewCampaign] = useState(null);
  const [contentUrl, setContentUrl] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [campaignsRes, submissionsRes, winsRes] = await Promise.all([
          api.get("/api/campaigns"),
          api.get("/api/submissions/mine"),
          api.get("/api/submissions/my-wins"),
        ]);

        setCampaigns(campaignsRes.data || []);
        setMySubmissions(submissionsRes.data || []);
        setWins(winsRes.data || []);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
        toast.error("Failed to load dashboard data");
      }
    };

    loadData();
  }, []);

  const hasSubmitted = (campaignId) =>
    mySubmissions.some(
      (s) => getCampaignIdFromRef(s.campaign) === String(campaignId)
    );

  const formatDeadline = (value) => {
    if (!value) return "Not specified";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString(undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const shortDescription = (text, maxChars = 90) => {
    const s = (text ?? "").toString().trim();
    if (!s) return "No description available";
    if (s.length <= maxChars) return s;
    const cut = s.slice(0, maxChars);
    const lastSpace = cut.lastIndexOf(" ");
    return `${cut.slice(0, lastSpace > 40 ? lastSpace : maxChars).trim()}...`;
  };

  const closeModal = () => {
    setSelectedCampaign(null);
    setContentUrl("");
  };

  const submitContent = async (e) => {
    e.preventDefault();

    try {
      await api.post("/api/submissions", {
        campaignId: selectedCampaign._id,
        contentUrl,
      });

      toast.success("Content submitted");
      closeModal();

      const res = await api.get("/api/submissions/mine");
      setMySubmissions(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Submission failed");
    }
  };

  return (
    <div className="dashboard-wrapper">
      <div className="dashboard">
        {/* HERO BANNER */}
        <div className="dashboard-hero">
          <div className="hero-text-col">
            <h2>🎨 Creator Dashboard</h2>
            <p className="dashboard-subtitle">
              Discover campaigns, showcase your creativity, and forge spectacular partnerships.
            </p>
          </div>
          <div className="hero-stats-grid">
            <div className="stat-card">
              <h4>Total Wins</h4>
              <span className="stat-val">{wins.length}</span>
            </div>
            <div className="stat-card">
              <h4>Open Campaigns</h4>
              <span className="stat-val">
                {campaigns.filter((c) => c && c._id).length}
              </span>
            </div>
          </div>
        </div>

        {/* 🎉 CONGRATULATIONS CARD */}
        {wins.length > 0 && (
          <div className="section">
            <div className="card congrats-card">

              <div className="congrats-content">
                <h3 className="congo-title">✨Congratulations!✨</h3>
                <b className="congrats-title">You’ve won a campaign 🎯</b>
                <p className="congrats-subtitle">
                  You have <strong>{wins.length}</strong>{" "}
                  {wins.length === 1 ? "win" : "wins"} so far. Keep it up!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 🏆 MY WINS */}
        {wins.length > 0 && (
          <div className="section">
            <h3 className="section-title">🏆 My Wins</h3>

            <div className="grid">
              {wins.map((w) => (
                <div className="card creator-win-card" key={w._id}>
                  <div className="card-header-row">
                    <h3>{titleForWin(w, campaigns)}</h3>
                    <span className="badge win-badge-gold">Winner</span>
                  </div>
                  <p className="card-description">🎉 You won this campaign.</p>
                  {prizeForWin(w, campaigns) ? (
                    <p className="prize-won-line card-prize">
                      Prize won:{" "}
                      <strong>{prizeForWin(w, campaigns)}</strong>
                      <sup className="fee-asterisk">*</sup>
                    </p>
                  ) : null}

                  <a
                    href={w.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="creator-view-submission-btn"
                  >
                    View Submission
                  </a>
                </div>
              ))}
            </div>
            {wins.some((w) => prizeForWin(w, campaigns)) && (
              <p className="platform-fee-note section-fee-note">
                * 5% will be debited as a platform fee from your payout.
              </p>
            )}
          </div>
        )}

        {/* 📢 AVAILABLE CAMPAIGNS */}
        <div className="section">
          <h3 className="section-title">Available Campaigns</h3>

          <div className="grid">
            {campaigns
              .filter((c) => c && c._id)
              .map((c) => {
                const submitted = hasSubmitted(c._id);

                return (
                  <div className="card creator-campaign-card" key={c._id}>
                    <div className="campaign-card-header">
                      <h3 className="campaign-card-title">{c.title || "Untitled Campaign"}</h3>
                      {c.reward && <span className="campaign-card-reward">{c.reward}</span>}
                    </div>
                    <p className="campaign-card-desc">
                      {shortDescription(c.description, 110)}
                    </p>

                    <div className="campaign-card-meta">
                      {c.deadline && (
                        <div className="campaign-meta-item">
                          <span>📅</span>
                          <span>Deadline: <strong>{formatDeadline(c.deadline)}</strong></span>
                        </div>
                      )}
                      <div className="campaign-meta-item">
                        <span>⚡</span>
                        <span>Status: <strong>{submitted ? "Submitted" : "Open for Content"}</strong></span>
                      </div>
                    </div>

                    <div className="campaign-card-actions">
                      {submitted ? (
                        <span className="badge">Submitted</span>
                      ) : (
                        <button
                          type="button"
                          className="campaign-submit-btn"
                          onClick={() => setSelectedCampaign(c)}
                        >
                          Submit Content
                        </button>
                      )}
                      <button
                        type="button"
                        className="campaign-details-btn"
                        onClick={() => setViewCampaign(c)}
                      >
                        View details →
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* SUBMIT MODAL */}
      {selectedCampaign && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-btn" onClick={closeModal}>
              ✕
            </button>

            <h3>Submit for: {selectedCampaign.title}</h3>

            <form onSubmit={submitContent}>
              <input
                placeholder="Paste Drive link or media link"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
              />

              <div
                style={{
                  marginTop: "0.9rem",
                  padding: "0.8rem",
                  border: "1px solid var(--border-light)",
                  borderRadius: "10px",
                  background: "var(--white-1)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, color: "var(--purple-2)" }}>
                  Minimum submission requirements
                </p>
                <ul style={{ margin: "0.55rem 0 0", paddingLeft: "1rem", fontSize: "0.88rem" }}>
                  <li>Video quality should be at least 1080p (Full HD).</li>
                  <li>Keep video clear, stable, and well-lit (no blurry footage).</li>
                  <li>Audio must be understandable with minimal background noise.</li>
                  <li>Your content should match the campaign brief and brand tone.</li>
                  <li>Submit a public, accessible Drive link or media link.</li>
                </ul>
              </div>

              <button type="submit" style={{ marginTop: "1rem" }}>
                Submit
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CAMPAIGN DETAILS MODAL */}
      {viewCampaign && (
        <div
          className="modal-overlay"
          onClick={() => setViewCampaign(null)}
        >
          <div
            className="modal campaign-details-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setViewCampaign(null)}
            >
              ✕
            </button>

            <div className="campaign-details-header">
              <span className="details-header-icon">📢</span>
              <h3>{viewCampaign.title || "Untitled Campaign"}</h3>
            </div>

            <div className="campaign-details-content">
              <div className="details-section">
                <h4>Campaign Brief</h4>
                <p>{viewCampaign.description || "No description available"}</p>
              </div>

              <div className="details-grid-specs">
                <div className="spec-item">
                  <span className="spec-icon">💰</span>
                  <div className="spec-info">
                    <span className="spec-label">Reward Amount</span>
                    <span className="spec-value">{viewCampaign.reward || "Not specified"}</span>
                  </div>
                </div>

                <div className="spec-item">
                  <span className="spec-icon">📅</span>
                  <div className="spec-info">
                    <span className="spec-label">Submission Deadline</span>
                    <span className="spec-value">{formatDeadline(viewCampaign.deadline)}</span>
                  </div>
                </div>
              </div>

              <div className="details-requirements">
                <h4>Submission Guidelines</h4>
                <ul>
                  <li>Video quality should be at least 1080p (Full HD).</li>
                  <li>Keep video clear, stable, and well-lit (no blurry footage).</li>
                  <li>Audio must be understandable with minimal background noise.</li>
                  <li>Your content should match the brief and brand tone.</li>
                </ul>
              </div>
            </div>

            <div className="campaign-details-actions">
              <button 
                type="button" 
                className="close-modal-btn" 
                onClick={() => setViewCampaign(null)}
              >
                Close Brief
              </button>
              {!hasSubmitted(viewCampaign._id) && (
                <button 
                  type="button" 
                  className="submit-content-btn-primary" 
                  onClick={() => {
                    setViewCampaign(null);
                    setSelectedCampaign(viewCampaign);
                  }}
                >
                  Submit Content Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
