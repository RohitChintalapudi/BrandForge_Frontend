import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";

const CreatorDashboard = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [wins, setWins] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
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
    mySubmissions.some((s) => s.campaign === campaignId);

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
      <div className="dashboard-background">
        <div className="dashboard-blob blob-1"></div>
        <div className="dashboard-blob blob-2"></div>
        <div className="dashboard-blob blob-3"></div>
      </div>

      <div className="dashboard">
        <div className="dashboard-header">
          <h2>🎨 Creator Dashboard</h2>
          <p className="dashboard-subtitle">
            Discover campaigns and showcase your creativity
          </p>
        </div>

        {wins.length > 0 && (
          <div className="congratulations-banner">
            <div className="banner-content">
              <div className="banner-icon">🎉</div>
              <div className="banner-text">
                <h3>Congratulations! You've won a campaign.</h3>
                <p>
                  You have {wins.length} {wins.length === 1 ? "win" : "wins"}!
                  Keep it up.
                </p>
              </div>
            </div>
            <div className="banner-shine"></div>
          </div>
        )}

        {/* 🏆 MY WINS */}
        {wins.length > 0 && (
          <div className="section">
            <h3 className="section-title">🏆 My Wins</h3>

            <div className="grid">
              {wins.map((w) => (
                <div className="card premium-card winner-card" key={w._id}>
                  <div className="card-header">
                    <h3>{w.campaign?.title}</h3>
                    <span className="badge winner">Winner</span>
                  </div>

                  <p className="card-description">🎉 You won this campaign.</p>

                  <a
                    href={w.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="content-link"
                  >
                    View Submission
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="section">
          <h3 className="section-title">Available Campaigns</h3>

          <div className="grid">
            {campaigns
              .filter((c) => c && c._id)
              .map((c) => {
                const submitted = hasSubmitted(c._id);

                return (
                  <div className="card premium-card" key={c._id}>
                    <h3>{c.title || "Untitled Campaign"}</h3>
                    <p className="card-description">
                      {c.description || "No description available"}
                    </p>

                    {submitted ? (
                      <span className="badge approved">Submitted</span>
                    ) : (
                      <button
                        className="action-btn premium-btn"
                        onClick={() => setSelectedCampaign(c)}
                      >
                        Submit Content
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

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

              <button
                type="submit"
                className="action-btn premium-btn"
                style={{ marginTop: "1rem" }}
              >
                Submit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
