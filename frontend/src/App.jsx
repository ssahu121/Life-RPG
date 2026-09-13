import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "http://localhost:8080/api/quests";
const PROGRESS_URL = "http://localhost:8080/api/progress";

const defaultStats = {
  Strength: 32,
  Intellect: 47,
  Discipline: 28,
  Creativity: 35,
};

const rewards = {
  Easy: {
    xp: 50,
    gold: 25,
  },
  Medium: {
    xp: 100,
    gold: 50,
  },
  Hard: {
    xp: 150,
    gold: 75,
  },
};

function App() {
  // =========================
  // LOGIN PROTECTION
  // =========================

  const isLoggedIn =
    localStorage.getItem("lifeRPGLoggedIn") === "true";

  if (!isLoggedIn) {
    window.location.href = "/login";
    return null;
  }

  // =========================
  // USER DATA
  // =========================

  const savedUser = localStorage.getItem("lifeRPGUser");

  let user = null;

  try {
    user = savedUser ? JSON.parse(savedUser) : null;
  } catch (error) {
    console.error("Failed to read user data:", error);
  }

  // =========================
  // JWT TOKEN
  // =========================

  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("lifeRPGToken");

  // =========================
  // RPG STATE
  // =========================

  const [quests, setQuests] = useState([]);

  // XP + LEVEL NOW COME FROM DATABASE
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  // Temporary frontend reward data
  const [gold, setGold] = useState(850);
  const [stats, setStats] = useState(defaultStats);

  const [showModal, setShowModal] = useState(false);
  const [showLevelUp, setShowLevelUp] = useState(false);

  const [loadingQuests, setLoadingQuests] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(true);

  const [savingQuest, setSavingQuest] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [newQuest, setNewQuest] = useState({
    title: "",
    description: "",
    attribute: "Intellect",
    difficulty: "Easy",
  });

  // =========================
  // AUTH HEADERS
  // =========================

  const getAuthHeaders = () => {
    if (!token) {
      return {};
    }

    return {
      Authorization: `Bearer ${token}`,
    };
  };

  // =========================
  // LOAD RPG PROGRESS
  // =========================

  const loadProgress = async () => {
    try {
      setLoadingProgress(true);

      const response = await fetch(
        PROGRESS_URL,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load progress (${response.status})`
        );
      }

      const data = await response.json();

      setXp(data.totalXp ?? 0);
      setLevel(data.level ?? 1);

    } catch (error) {
      console.error(
        "Failed to load progress:",
        error
      );

      setErrorMessage(
        "Unable to load character progress."
      );
    } finally {
      setLoadingProgress(false);
    }
  };

  // =========================
  // LOAD PROGRESS ON START
  // =========================

  useEffect(() => {
    if (!token) {
      setErrorMessage(
        "Login session expired. Please login again."
      );
      return;
    }

    loadProgress();
  }, []);

  // =========================
  // LOAD QUESTS
  // =========================

  useEffect(() => {
    if (!token) {
      setLoadingQuests(false);
      return;
    }

    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      setLoadingQuests(true);
      setErrorMessage("");

      const response = await fetch(
        API_URL,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load quests (${response.status})`
        );
      }

      const data = await response.json();

      const formattedQuests = data.map(
        (quest) => ({
          ...quest,

          attribute:
            quest.attribute ||
            "Intellect",

          difficulty:
            quest.difficulty ||
            getDifficultyFromXp(
              quest.xp
            ),

          gold:
            quest.gold ||
            getGoldFromXp(
              quest.xp
            ),
        })
      );

      setQuests(formattedQuests);

    } catch (error) {
      console.error(
        "Failed to load quests:",
        error
      );

      setErrorMessage(
        "Unable to load quests from server."
      );
    } finally {
      setLoadingQuests(false);
    }
  };

  // =========================
  // CREATE QUEST
  // =========================

  const handleCreateQuest = async (e) => {
    e.preventDefault();

    if (!newQuest.title.trim()) {
      alert("Please enter a quest name.");
      return;
    }

    if (!token) {
      alert(
        "Login session expired. Please login again."
      );
      return;
    }

    const reward =
      rewards[newQuest.difficulty];

    try {
      setSavingQuest(true);
      setErrorMessage("");

      const params =
        new URLSearchParams();

      params.append(
        "title",
        newQuest.title.trim()
      );

      params.append(
        "description",
        newQuest.description.trim()
      );

      params.append(
        "xp",
        reward.xp
      );

      const response = await fetch(
        `${API_URL}?${params.toString()}`,
        {
          method: "POST",

          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to create quest (${response.status})`
        );
      }

      const savedQuest =
        await response.json();

      const formattedQuest = {
        ...savedQuest,

        attribute:
          newQuest.attribute,

        difficulty:
          newQuest.difficulty,

        gold:
          reward.gold,
      };

      setQuests((prev) => [
        ...prev,
        formattedQuest,
      ]);

      setNewQuest({
        title: "",
        description: "",
        attribute: "Intellect",
        difficulty: "Easy",
      });

      setShowModal(false);

    } catch (error) {
      console.error(
        "Failed to create quest:",
        error
      );

      setErrorMessage(
        "Quest could not be created."
      );
    } finally {
      setSavingQuest(false);
    }
  };

  // =========================
  // COMPLETE QUEST
  // =========================

  const completeQuest = async (id) => {
    const quest = quests.find(
      (item) => item.id === id
    );

    if (!quest || quest.completed) {
      return;
    }

    try {
      setErrorMessage("");

      const oldLevel = level;

      const response = await fetch(
        `${API_URL}/${id}/complete`,
        {
          method: "PUT",

          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        const message =
          await response.text();

        throw new Error(
          message ||
            `Failed to complete quest (${response.status})`
        );
      }

      const updatedQuest =
        await response.json();

      setQuests((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                ...updatedQuest,

                attribute:
                  item.attribute,

                difficulty:
                  item.difficulty,

                gold:
                  item.gold ||
                  getGoldFromXp(
                    item.xp
                  ),
              }
            : item
        )
      );

      // =========================
      // RELOAD REAL XP + LEVEL
      // FROM DATABASE
      // =========================

      await loadProgress();

      // =========================
      // GOLD
      // =========================

      const questGold =
        quest.gold ||
        getGoldFromXp(quest.xp);

      setGold(
        (currentGold) =>
          currentGold + questGold
      );

      // =========================
      // ATTRIBUTE
      // =========================

      setStats(
        (currentStats) => ({
          ...currentStats,

          [quest.attribute]:
            (currentStats[
              quest.attribute
            ] || 0) + 2,
        })
      );

      // =========================
      // LEVEL UP CHECK
      // =========================

      const progressResponse =
        await fetch(
          PROGRESS_URL,
          {
            headers: {
              ...getAuthHeaders(),
            },
          }
        );

      if (progressResponse.ok) {
        const progress =
          await progressResponse.json();

        if (
          progress.level > oldLevel
        ) {
          setShowLevelUp(true);

          setTimeout(() => {
            setShowLevelUp(false);
          }, 2500);
        }
      }

    } catch (error) {
      console.error(
        "Failed to complete quest:",
        error
      );

      setErrorMessage(
        error.message ||
          "Quest could not be completed."
      );
    }
  };

  // =========================
  // DELETE QUEST
  // =========================

  const deleteQuest = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this quest?"
      );

    if (!confirmed) return;

    try {
      setErrorMessage("");

      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",

          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete quest (${response.status})`
        );
      }

      setQuests((prev) =>
        prev.filter(
          (quest) =>
            quest.id !== id
        )
      );

    } catch (error) {
      console.error(
        "Failed to delete quest:",
        error
      );

      setErrorMessage(
        "Quest could not be deleted."
      );
    }
  };

  // =========================
  // LOGOUT
  // =========================

  const handleLogout = () => {
    localStorage.removeItem(
      "lifeRPGLoggedIn"
    );

    localStorage.removeItem(
      "lifeRPGUser"
    );

    localStorage.removeItem(
      "token"
    );

    localStorage.removeItem(
      "lifeRPGToken"
    );

    window.location.href =
      "/login";
  };

  // =========================
  // HELPERS
  // =========================

  const getDifficultyFromXp = (
    questXp
  ) => {
    if (questXp >= 150) {
      return "Hard";
    }

    if (questXp >= 100) {
      return "Medium";
    }

    return "Easy";
  };

  const getGoldFromXp = (
    questXp
  ) => {
    if (questXp >= 150) {
      return 75;
    }

    if (questXp >= 100) {
      return 50;
    }

    return 25;
  };

  // =========================
  // NON-LINEAR XP DISPLAY
  // =========================

  // Backend formula:
  // required XP for level N = 100 * N * N
  //
  // Current level 1 -> next level at 100 XP
  // Current level 2 -> next level at 400 XP
  // Current level 3 -> next level at 900 XP

  const currentLevelStartXp =
    level <= 1
      ? 0
      : 100 * (level - 1) * (level - 1);

  const nextLevelXp =
    100 * level * level;

  const levelXp =
    Math.max(
      xp - currentLevelStartXp,
      0
    );

  const requiredLevelXp =
    Math.max(
      nextLevelXp -
        currentLevelStartXp,
      1
    );

  const xpPercentage =
    Math.min(
      (levelXp /
        requiredLevelXp) *
        100,
      100
    );

  // =========================
  // COMPLETED QUESTS
  // =========================

  const completedQuests =
    quests.filter(
      (quest) =>
        quest.completed
    ).length;

  return (
    <div className="app">

      {/* =========================
          SIDEBAR
      ========================= */}

      <aside className="sidebar">

        <div className="logo">
          ⚔ LIFE RPG
        </div>

        <nav className="nav">

          <a
            href="#"
            className="active"
          >
            🏠 Dashboard
          </a>

          <a href="#quests">
            ⚔ Quests
          </a>

          <a href="#character">
            🧙 Character
          </a>

          <a href="#shop">
            🛒 Shop
          </a>

        </nav>

        <button
          className="logout-btn"
          onClick={handleLogout}
        >
          🚪 Logout
        </button>

      </aside>

      {/* =========================
          MAIN
      ========================= */}

      <main className="main">

        {/* HEADER */}

        <header className="header">

          <div>

            <p className="header-label">
              WELCOME BACK, HERO
            </p>

            <h1>
              Welcome back,{" "}
              {user?.name ||
                "Hero"} ⚔️
            </h1>

            <p className="header-subtitle">
              Your daily adventure awaits.
            </p>

          </div>

          <div className="gold-display">
            🪙 {gold} Gold
          </div>

        </header>

        {/* SERVER ERROR */}

        {errorMessage && (
          <div className="error-message">
            ⚠️ {errorMessage}
          </div>
        )}

        {/* =========================
            CHARACTER
        ========================= */}

        <section
          className="character-card"
          id="character"
        >

          <div className="character-left">

            <div className="avatar">
              🧙
            </div>

            <div className="character-info">

              <p className="small-label">
                YOUR CHARACTER
              </p>

              <h2>
                {user?.name ||
                  "Life Adventurer"}
              </h2>

              <p className="character-class">
                Level {level} • Life Adventurer
              </p>

              <div className="xp-container">

                <div className="xp-info">

                  <span>
                    {loadingProgress
                      ? "Loading XP..."
                      : `${levelXp} / ${requiredLevelXp} XP`}
                  </span>

                  <span>
                    Level {level}
                  </span>

                </div>

                <div className="xp-bar">

                  <div
                    className="xp-fill"
                    style={{
                      width:
                        `${xpPercentage}%`,
                    }}
                  />

                </div>

                <small
                  style={{
                    display: "block",
                    marginTop: "6px",
                    opacity: 0.7,
                  }}
                >
                  Total XP: {xp}
                </small>

              </div>

            </div>

          </div>

          <div className="streak">

            <div className="streak-icon">
              🔥
            </div>

            <div>
              <strong>
                7 Day Streak
              </strong>

              <span>
                Keep going!
              </span>
            </div>

          </div>

        </section>

        {/* =========================
            STATS
        ========================= */}

        <section className="stats-section">

          <div className="section-heading">

            <div>

              <p className="small-label">
                CHARACTER ATTRIBUTES
              </p>

              <h2>
                Your Stats
              </h2>

            </div>

          </div>

          <div className="stats-grid">

            <div className="stat-card">

              <span className="stat-icon">
                💪
              </span>

              <div>
                <p>Strength</p>

                <strong>
                  {stats.Strength}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <span className="stat-icon">
                🧠
              </span>

              <div>
                <p>Intellect</p>

                <strong>
                  {stats.Intellect}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <span className="stat-icon">
                🎯
              </span>

              <div>
                <p>Discipline</p>

                <strong>
                  {stats.Discipline}
                </strong>
              </div>

            </div>

            <div className="stat-card">

              <span className="stat-icon">
                🎨
              </span>

              <div>
                <p>Creativity</p>

                <strong>
                  {stats.Creativity}
                </strong>
              </div>

            </div>

          </div>

        </section>

        {/* =========================
            QUESTS
        ========================= */}

        <section
          className="quests-section"
          id="quests"
        >

          <div className="section-heading">

            <div>

              <p className="small-label">
                TODAY'S ADVENTURES
              </p>

              <h2>
                Your Quests
              </h2>

              <p className="quest-count">
                {completedQuests} of{" "}
                {quests.length} completed
              </p>

            </div>

            <button
              className="new-quest-btn"
              onClick={() =>
                setShowModal(true)
              }
            >
              + New Quest
            </button>

          </div>

          {/* LOADING */}

          {loadingQuests ? (

            <div className="empty-state">

              <div>⚔️</div>

              <h3>
                Loading quests...
              </h3>

              <p>
                Preparing your adventure.
              </p>

            </div>

          ) : (

            <div className="quests-list">

              {quests.length === 0 ? (

                <div className="empty-state">

                  <div>⚔️</div>

                  <h3>
                    No quests yet
                  </h3>

                  <p>
                    Create your first quest
                    and start earning XP.
                  </p>

                </div>

              ) : (

                quests.map(
                  (quest) => (

                    <div
                      className={`quest-card ${
                        quest.completed
                          ? "completed"
                          : ""
                      }`}
                      key={quest.id}
                    >

                      <div className="quest-main">

                        <button
                          className={`complete-btn ${
                            quest.completed
                              ? "done"
                              : ""
                          }`}
                          onClick={() =>
                            completeQuest(
                              quest.id
                            )
                          }
                          disabled={
                            quest.completed
                          }
                          title={
                            quest.completed
                              ? "Completed"
                              : "Complete quest"
                          }
                        >
                          {quest.completed
                            ? "✓"
                            : "○"}
                        </button>

                        <div className="quest-content">

                          <h3>
                            {quest.title}
                          </h3>

                          {quest.description && (
                            <p className="quest-description">
                              {
                                quest.description
                              }
                            </p>
                          )}

                          <div className="quest-meta">

                            <span className="attribute">
                              {
                                quest.attribute
                              }
                            </span>

                            <span
                              className={`difficulty ${
                                (
                                  quest.difficulty ||
                                  "Easy"
                                ).toLowerCase()
                              }`}
                            >
                              {
                                quest.difficulty ||
                                "Easy"
                              }
                            </span>

                          </div>

                        </div>

                      </div>

                      <div className="quest-rewards">

                        <div>

                          <strong>
                            +{quest.xp} XP
                          </strong>

                          <span>
                            +{
                              quest.gold ||
                              getGoldFromXp(
                                quest.xp
                              )
                            } Gold
                          </span>

                        </div>

                        <button
                          className="delete-btn"
                          onClick={() =>
                            deleteQuest(
                              quest.id
                            )
                          }
                          title="Delete quest"
                        >
                          🗑
                        </button>

                      </div>

                    </div>

                  )
                )

              )}

            </div>

          )}

        </section>

        {/* =========================
            SHOP
        ========================= */}

        <section
          className="shop-section"
          id="shop"
        >

          <div className="section-heading">

            <div>

              <p className="small-label">
                REWARDS
              </p>

              <h2>
                RPG Shop
              </h2>

            </div>

          </div>

          <div className="shop-preview">

            <div className="shop-item">

              <span>🏆</span>

              <div>
                <strong>
                  Achievement Badge
                </strong>

                <small>
                  Coming soon
                </small>
              </div>

            </div>

            <div className="shop-item">

              <span>🎨</span>

              <div>
                <strong>
                  Premium Theme
                </strong>

                <small>
                  Coming soon
                </small>
              </div>

            </div>

            <div className="shop-item">

              <span>⚔️</span>

              <div>
                <strong>
                  Legendary Gear
                </strong>

                <small>
                  Coming soon
                </small>
              </div>

            </div>

          </div>

        </section>

      </main>

      {/* =========================
          NEW QUEST MODAL
      ========================= */}

      {showModal && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowModal(false)
          }
        >

          <div
            className="modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="modal-header">

              <div>

                <p className="small-label">
                  NEW ADVENTURE
                </p>

                <h2>
                  Create Quest
                </h2>

              </div>

              <button
                className="close-btn"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ✕
              </button>

            </div>

            <form
              onSubmit={
                handleCreateQuest
              }
              className="quest-form"
            >

              <div className="input-group">

                <label>
                  Quest Name
                </label>

                <input
                  type="text"
                  placeholder="e.g. Study Java for 1 hour"
                  value={
                    newQuest.title
                  }
                  onChange={(e) =>
                    setNewQuest({
                      ...newQuest,
                      title:
                        e.target.value,
                    })
                  }
                />

              </div>

              <div className="input-group">

                <label>
                  Description
                </label>

                <textarea
                  placeholder="Describe your quest..."
                  value={
                    newQuest.description
                  }
                  onChange={(e) =>
                    setNewQuest({
                      ...newQuest,
                      description:
                        e.target.value,
                    })
                  }
                  rows="3"
                />

              </div>

              <div className="input-group">

                <label>
                  Attribute
                </label>

                <select
                  value={
                    newQuest.attribute
                  }
                  onChange={(e) =>
                    setNewQuest({
                      ...newQuest,
                      attribute:
                        e.target.value,
                    })
                  }
                >

                  <option value="Strength">
                    💪 Strength
                  </option>

                  <option value="Intellect">
                    🧠 Intellect
                  </option>

                  <option value="Discipline">
                    🎯 Discipline
                  </option>

                  <option value="Creativity">
                    🎨 Creativity
                  </option>

                </select>

              </div>

              <div className="input-group">

                <label>
                  Difficulty
                </label>

                <select
                  value={
                    newQuest.difficulty
                  }
                  onChange={(e) =>
                    setNewQuest({
                      ...newQuest,
                      difficulty:
                        e.target.value,
                    })
                  }
                >

                  <option value="Easy">
                    Easy • +50 XP
                  </option>

                  <option value="Medium">
                    Medium • +100 XP
                  </option>

                  <option value="Hard">
                    Hard • +150 XP
                  </option>

                </select>

              </div>

              <button
                className="auth-btn"
                type="submit"
                disabled={savingQuest}
              >
                {savingQuest
                  ? "Creating..."
                  : "⚔ Create Quest"}
              </button>

            </form>

          </div>

        </div>

      )}

      {/* =========================
          LEVEL UP
      ========================= */}

      {showLevelUp && (

        <div className="level-up-overlay">

          <div className="level-up-card">

            <div className="level-up-icon">
              ✨
            </div>

            <p>
              LEVEL UP!
            </p>

            <h2>
              Level {level}
            </h2>

            <span>
              Your hero grows stronger!
            </span>

          </div>

        </div>

      )}

    </div>
  );
}

export default App;

