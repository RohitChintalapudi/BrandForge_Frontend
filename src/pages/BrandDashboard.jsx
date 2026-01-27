import { useEffect, useState } from "react";
import api from "../api/axios";
import { toast } from "react-toastify";
import Confetti from "react-confetti";

const BrandDashboard = () => {
  const [form, setForm] = useState({
    title: "",
    description: "",
    reward: "",
    deadline: "",
  });

  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [winner, setWinner] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWinner, setShowWinner] = useState(false); 

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

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/api/campaigns", form);
      toast.success("Campaign created (pending admin approval)");
      setForm({ title: "", description: "", reward: "", deadline: "" });
      fetchCampaigns();
    } catch {
      toast.error("Failed to create campaign");
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
      if (winning) setWinner(winning);
    } catch {
      toast.error("Failed to load submissions");
    }
  };

  const selectWinner = async (id) => {
    try {
      await api.put(`/api/submissions/${id}/winner`);
      toast.success("Winner selected");

      setSubmissions((prev) =>
        prev.map((s) => (s._id === id ? { ...s, status: "winner" } : s))
      );

      const selected = submissions.find((s) => s._id === id);
      if (selected) {
        setWinner({ ...selected, status: "winner" });
        setShowWinner(false);
      }
    } catch {
      toast.error("Failed to select winner");
    }
  };

  const viewWinner = () => {
    setShowWinner(true);
    setShowConfetti(true);

    setTimeout(() => {
      setShowConfetti(false);
    }, 5000);
  };

  return (
    <div className="dashboard-wrapper">
      {showConfetti && <Confetti />}

      <div className="dashboard">
        <div className="dashboard-header">
          <h2>🏢 Brand Dashboard</h2>
          <b className="dashboard-subtitle">
            Create campaigns and select winners
          </b>
        </div>

        {!selectedCampaign && (
          <>
            <div className="card premium-card create-card">
              <h3>Create Campaign</h3>

              <form onSubmit={handleCreate} className="forms">
                <input
                  placeholder="Campaign Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />

                <textarea
                  placeholder="Campaign Description"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description: e.target.value,
                    })
                  }
                  required
                />

                <input
                  placeholder="Reward (e.g ₹5000)"
                  value={form.reward}
                  onChange={(e) => setForm({ ...form, reward: e.target.value })}
                  required
                />

                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deadline: e.target.value,
                    })
                  }
                  required
                />

                <button className="action-btn premium-btn">
                  Create Campaign
                </button>
              </form>
            </div>

            <div className="grid" style={{ marginTop: "2rem" }}>
              {campaigns
                .filter((c) => c && c._id)
                .map((c) => (
                  <div className="card premium-card" key={c._id}>
                    <div className="card-header">
                      <h3>{c.title || "Untitled Campaign"}</h3>
                      {c.status && (
                        <span className={`badge ${c.status}`}>
                          {c.status === "pending" && "Pending Approval"}
                          {c.status === "approved" && "Approved"}
                        </span>
                      )}
                    </div>

                    <p className="card-description">
                      {c.description || "No description available"}
                    </p>

                    <button
                      className="action-btn premium-btn"
                      style={{ marginTop: "0.8rem" }}
                      onClick={() => openSubmissions(c)}
                    >
                      View Submissions
                    </button>
                  </div>
                ))}
            </div>
          </>
        )}

        {selectedCampaign && (
          <>
            <button
              className="action-btn premium-btn back-btn"
              onClick={() => {
                setSelectedCampaign(null);
                setShowWinner(false);
                setShowConfetti(false);
              }}
            >
              ← Back
            </button>

            <h3 className="section-title">Submissions</h3>

            {winner && !showWinner && (
              <button
                className="action-btn premium-btn"
                style={{ marginBottom: "1.5rem" }}
                onClick={viewWinner}
              >
                View Winner 🎉
              </button>
            )}

            {winner && showWinner && (
              <div
                className="card premium-card winner-card"
                style={{ marginBottom: "2rem" }}
              >
                <h3>🏆 Winner Selected</h3>
                <p>
                  <strong>{winner.creator?.name}</strong>
                </p>

                <a
                  href={winner.contentUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="content-link"
                >
                  View Winning Content
                </a>
              </div>
            )}

            <div className="grid">
              {submissions.map((s) => (
                <div className="card premium-card" key={s._id}>
                  <p>
                    <strong>Creator:</strong> {s.creator?.name}
                  </p>

                  <a
                    href={s.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="content-link"
                  >
                    View Content
                  </a>

                  {s.status === "winner" ? (
                    <span className="badge winner">🏆 Winner</span>
                  ) : (
                    <button
                      className="action-btn premium-btn"
                      onClick={() => selectWinner(s._id)}
                    >
                      Select Winner
                    </button>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BrandDashboard;
