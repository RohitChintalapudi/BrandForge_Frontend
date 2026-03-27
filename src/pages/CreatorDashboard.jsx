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
        {/* HEADER */}
        <div className="dashboard-header">
          <h2>🎨 Creator Dashboard</h2>
          <b className="dashboard-subtitle">
            Discover campaigns and showcase your creativity
          </b>
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
                <div className="card" key={w._id}>
                  <h3>{titleForWin(w, campaigns)}</h3>
                  <p className="card-description">🎉 You won this campaign.</p>
                  {prizeForWin(w, campaigns) ? (
                    <p className="prize-won-line card-prize">
                      Prize won:{" "}
                      <strong>{prizeForWin(w, campaigns)}</strong>
                      <sup className="fee-asterisk">*</sup>
                    </p>
                  ) : null}

                  <span className="badge">Winner</span>

                  <a
                    href={w.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="content-link submit-link"
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
                  <div className="card" key={c._id}>
                    <h3>{c.title || "Untitled Campaign"}</h3>
                    <p className="card-description">
                      {c.description || "No description available"}
                    </p>

                    <div style={{ marginTop: "0.6rem", display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
                      {submitted ? (
                        <span className="badge">Submitted</span>
                      ) : (
                        <button
                          type="button"
                          className="submitContent"
                          onClick={() => setSelectedCampaign(c)}
                        >
                          Submit Content
                        </button>
                      )}
                      <button
                        type="button"
                        className="action-btn"
                        style={{
                          background: "transparent",
                          color: "var(--purple-2)",
                          paddingInline: 0,
                        }}
                        onClick={() => setViewCampaign(c)}
                      >
                        View details
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
                placeholder="Paste YouTube / Instagram / Drive link"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                required
              />

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
            className="modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setViewCampaign(null)}
            >
              ✕
            </button>

            <h3>{viewCampaign.title || "Untitled Campaign"}</h3>
            <p style={{ marginTop: "0.8rem" }}>
              {viewCampaign.description || "No description available"}
            </p>
            {viewCampaign.reward && (
              <p style={{ marginTop: "1rem", fontWeight: 600 }}>
                Reward:{" "}
                <span style={{ fontWeight: 700 }}>{viewCampaign.reward}</span>
              </p>
            )}
            {viewCampaign.deadline && (
              <p style={{ marginTop: "0.6rem", fontSize: "0.9rem" }}>
                Deadline:{" "}
                <span style={{ fontWeight: 500 }}>
                  {formatDeadline(viewCampaign.deadline)}
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
