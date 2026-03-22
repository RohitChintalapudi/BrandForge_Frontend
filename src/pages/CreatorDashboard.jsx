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

                    {submitted ? (
                      <span className="badge">Submitted</span>
                    ) : (
                      <button className="submitContent" onClick={() => setSelectedCampaign(c)}>
                        Submit Content
                      </button>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* MODAL */}
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
    </div>
  );
};

export default CreatorDashboard;
