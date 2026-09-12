import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { apiFetch } from '../lib/api';
import { sound } from '../lib/sound';
import confetti from 'canvas-confetti';
import {
  xpForCharacterLevel,
  xpForAttributeLevel,
  rewardsFor,
  applyXp,
  computeStreak,
  streakBonusPercent,
  applyStreakBonus,
} from '../lib/progression';

const GameContext = createContext();

const INITIAL_SKILL_TREES = [
  { name: 'Strength', level: 3, currentXp: 80, xpToNextLevel: 50 },
  { name: 'Intellect', level: 2, currentXp: 40, xpToNextLevel: 31 },
  { name: 'Vitality', level: 3, currentXp: 50, xpToNextLevel: 80 },
  { name: 'Discipline', level: 4, currentXp: 120, xpToNextLevel: 80 },
  { name: 'Charisma', level: 2, currentXp: 20, xpToNextLevel: 51 },
];

const INITIAL_CHARACTER = {
  id: 'guest-hero',
  username: 'Ignis Hero',
  email: 'hero@emberquest.io',
  avatarUrl: null,
  level: 3,
  totalXp: 340,
  gold: 145,
  currentStreak: 7,
  longestStreak: 12,
  lastActiveDay: new Date().toISOString(),
  xpToNextLevel: 180,
  attributes: INITIAL_SKILL_TREES,
  equippedTitle: 'the Relentless',
  equippedBadge: 'First Flame Badge',
  equippedTheme: 'Crimson Keep',
};

const INITIAL_QUESTS = [
  {
    id: 'q-1',
    title: 'Complete EmberQuest Frontend Architecture',
    description: 'Build glowing dark-fantasy web UI with skill trees, shop, and level celebrations.',
    attribute: 'Discipline',
    difficulty: 'EPIC',
    xpReward: 200,
    goldReward: 60,
    status: 'ACTIVE',
    recurrence: 'NONE',
    dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-2',
    title: 'Read 2 Chapters of Architecture & Algorithms',
    description: 'Level up technical knowledge and deep thinking.',
    attribute: 'Intellect',
    difficulty: 'MEDIUM',
    xpReward: 50,
    goldReward: 12,
    status: 'ACTIVE',
    recurrence: 'DAILY',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-3',
    title: 'Conquer Heavy Workout Routine',
    description: 'Bench press, deadlifts, and core conditioning.',
    attribute: 'Strength',
    difficulty: 'HARD',
    xpReward: 100,
    goldReward: 25,
    status: 'ACTIVE',
    recurrence: 'DAILY',
    dueDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-4',
    title: 'Dawn 5KM Endurance Run',
    description: 'Keep stamina high and boost vitality.',
    attribute: 'Vitality',
    difficulty: 'HARD',
    xpReward: 100,
    goldReward: 25,
    status: 'ACTIVE',
    recurrence: 'WEEKLY',
    dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-5',
    title: 'Lead Cross-Team Strategy Sync',
    description: 'Align team roadmap and present feature vision.',
    attribute: 'Charisma',
    difficulty: 'EASY',
    xpReward: 25,
    goldReward: 5,
    status: 'ACTIVE',
    recurrence: 'NONE',
    dueDate: null,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'q-6',
    title: 'Morning Hydration & Cold Shower',
    description: 'Start the daily streak with high energy.',
    attribute: 'Vitality',
    difficulty: 'TRIVIAL',
    xpReward: 10,
    goldReward: 2,
    status: 'COMPLETED',
    recurrence: 'DAILY',
    dueDate: null,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const SHOP_ITEMS = [
  { id: 's-1', name: 'Crimson Keep Theme', description: 'Deep red banners for your halls.', cost: 100, type: 'theme', icon: '🏰' },
  { id: 's-2', name: 'Obsidian Library Theme', description: 'Dark stone and candlelight.', cost: 150, type: 'theme', icon: '📚' },
  { id: 's-3', name: 'Golden Harvest Theme', description: 'Warm golds for legendary days.', cost: 250, type: 'theme', icon: '🌾' },
  { id: 's-4', name: 'First Flame Badge', description: 'Proof of your first completed quest.', cost: 50, type: 'badge', icon: '🔥' },
  { id: 's-5', name: 'Oathkeeper Badge', description: 'For heroes of the weekly grind.', cost: 120, type: 'badge', icon: '⚔️' },
  { id: 's-6', name: 'Dragonslayer Badge', description: 'For those who finish EPIC quests.', cost: 300, type: 'badge', icon: '🐉' },
  { id: 's-7', name: 'Title: the Relentless', description: 'Append to your hero name.', cost: 60, type: 'title', icon: '👑' },
  { id: 's-8', name: 'Title: Bane of Procrastination', description: 'The rarest of honors.', cost: 200, type: 'title', icon: '⚡' },
  { id: 's-9', name: 'Ember Fox Avatar', description: 'A cunning companion portrait.', cost: 90, type: 'avatar', icon: '🦊' },
  { id: 's-10', name: 'Stone Golem Avatar', description: 'An unmovable portrait.', cost: 180, type: 'avatar', icon: '🗿' },
];

export function GameProvider({ children }) {
  const { user, isBackendConnected } = useAuth();

  // Local Storage state with fallback defaults
  const [character, setCharacter] = useState(() => {
    const saved = localStorage.getItem('eq_character');
    return saved ? JSON.parse(saved) : INITIAL_CHARACTER;
  });

  const [quests, setQuests] = useState(() => {
    const saved = localStorage.getItem('eq_quests');
    return saved ? JSON.parse(saved) : INITIAL_QUESTS;
  });

  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('eq_inventory');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 'inv-1', itemId: 's-1', equipped: true, item: SHOP_ITEMS[0] },
          { id: 'inv-4', itemId: 's-4', equipped: true, item: SHOP_ITEMS[3] },
          { id: 'inv-7', itemId: 's-7', equipped: true, item: SHOP_ITEMS[6] },
        ];
  });

  const [activityLogs, setActivityLogs] = useState(() => {
    const saved = localStorage.getItem('eq_activity_logs');
    return saved
      ? JSON.parse(saved)
      : [
          { id: 'a-1', action: 'quest_completed', text: 'Completed quest "Morning Hydration"', xpDelta: 10, goldDelta: 2, createdAt: new Date().toISOString() },
          { id: 'a-2', action: 'level_up', text: 'Reached Hero Level 3!', xpDelta: 0, goldDelta: 0, createdAt: new Date(Date.now() - 3600000 * 5).toISOString() },
        ];
  });

  const [shopItems] = useState(SHOP_ITEMS);
  const [levelUpData, setLevelUpData] = useState(null); // Triggers Level Up Modal
  const [activeTab, setActiveTab] = useState('quests'); // 'quests' | 'skills' | 'shop' | 'activity'
  const [questFilter, setQuestFilter] = useState('active'); // 'active' | 'completed' | 'all'
  const [selectedAttribute, setSelectedAttribute] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  const addToast = useCallback((title, message, type = 'info', duration = 4000) => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Save to LocalStorage on state change (for standalone persistence)
  useEffect(() => {
    if (!user) {
      localStorage.setItem('eq_character', JSON.stringify(character));
      localStorage.setItem('eq_quests', JSON.stringify(quests));
      localStorage.setItem('eq_inventory', JSON.stringify(inventory));
      localStorage.setItem('eq_activity_logs', JSON.stringify(activityLogs));
    }
  }, [character, quests, inventory, activityLogs, user]);

  // Sync with API when user is logged in
  const refreshDataFromApi = useCallback(async () => {
    if (!user || !isBackendConnected) return;
    setDataLoading(true);
    try {
      const [charRes, questActiveRes, questCompRes, shopRes, invRes, logsRes] = await Promise.allSettled([
        apiFetch('/api/character'),
        apiFetch('/api/quests?status=active'),
        apiFetch('/api/quests?status=completed'),
        apiFetch('/api/shop'),
        apiFetch('/api/inventory'),
        apiFetch('/api/activity-log'),
      ]);

      if (charRes.status === 'fulfilled' && charRes.value?.character) {
        setCharacter((prev) => ({ ...prev, ...charRes.value.character }));
      }

      const activeList = questActiveRes.status === 'fulfilled' ? questActiveRes.value?.quests || [] : [];
      const compList = questCompRes.status === 'fulfilled' ? questCompRes.value?.quests || [] : [];
      if (activeList.length > 0 || compList.length > 0) {
        setQuests([...activeList, ...compList]);
      }

      if (invRes.status === 'fulfilled' && invRes.value?.inventory) {
        setInventory(invRes.value.inventory);
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.logs) {
        setActivityLogs(logsRes.value.logs);
      }
    } catch {
      // Fallback to local state if fetch encounters error
    } finally {
      setDataLoading(false);
    }
  }, [user, isBackendConnected]);

  useEffect(() => {
    if (user) {
      refreshDataFromApi();
    }
  }, [user, refreshDataFromApi]);

  // --- ACTIONS ---

  // Complete Quest (Optimistic Mutation with Rollback)
  const completeQuest = async (questId) => {
    sound.playQuestComplete();

    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'COMPLETED') return;

    // Snapshot state for potential rollback
    const prevQuests = quests;
    const prevCharacter = character;
    const prevActivityLogs = activityLogs;

    // Optimistically calculate rewards locally
    const baseRewards = rewardsFor(targetQuest.difficulty);
    const xpGained = applyStreakBonus(baseRewards.xpReward, character.currentStreak);
    const goldGained = baseRewards.goldReward;

    const charResult = applyXp({
      level: character.level,
      currentXp: character.totalXp,
      gained: xpGained,
      xpForLevel: xpForCharacterLevel,
    });

    let attrLeveledUp = false;
    let newAttrLevel = 1;
    const updatedAttributes = (character.attributes || []).map((attr) => {
      if (attr.name === targetQuest.attribute) {
        const attrRes = applyXp({
          level: attr.level,
          currentXp: attr.currentXp,
          gained: xpGained,
          xpForLevel: xpForAttributeLevel,
        });
        attrLeveledUp = attrRes.leveledUp;
        newAttrLevel = attrRes.level;
        return {
          ...attr,
          level: attrRes.level,
          currentXp: attrRes.currentXp,
          xpToNextLevel: xpForAttributeLevel(attrRes.level) - attrRes.currentXp,
        };
      }
      return attr;
    });

    // Apply Optimistic Update Immediately!
    setQuests((prev) =>
      prev.map((q) =>
        q.id === questId
          ? { ...q, status: 'COMPLETED', completedAt: new Date().toISOString() }
          : q
      )
    );

    const nextCharacter = {
      ...character,
      level: charResult.level,
      totalXp: charResult.currentXp,
      gold: character.gold + goldGained,
      xpToNextLevel: xpForCharacterLevel(charResult.level) - charResult.currentXp,
      attributes: updatedAttributes,
    };
    setCharacter(nextCharacter);

    const newLog = {
      id: 'log-' + Date.now(),
      action: 'quest_completed',
      text: `Completed quest "${targetQuest.title}" (+${xpGained} XP, +${goldGained} Gold)`,
      xpDelta: xpGained,
      goldDelta: goldGained,
      createdAt: new Date().toISOString(),
    };
    setActivityLogs((prev) => [newLog, ...prev]);

    if (charResult.leveledUp || attrLeveledUp) {
      sound.playLevelUp();
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
      setLevelUpData({
        newLevel: charResult.level,
        levelsGained: charResult.levelsGained,
        attributeName: targetQuest.attribute,
        attributeLevel: newAttrLevel,
        xpGained,
        goldGained,
      });
    }

    // Backend Request Synchronization
    if (user && isBackendConnected) {
      try {
        const res = await apiFetch(`/api/quests/${questId}/complete`, { method: 'POST' });
        if (res?.alreadyCompleted) return;

        if (res?.leveledUp) {
          sound.playLevelUp();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
          setLevelUpData({
            newLevel: res.character.level,
            levelsGained: res.levelsGained,
            attributeName: res.attribute?.name,
            attributeLevel: res.attribute?.level,
            xpGained: res.xpGained,
            goldGained: res.goldGained,
          });
        }
        await refreshDataFromApi();
      } catch (err) {
        // Rollback optimistic update on failure!
        setQuests(prevQuests);
        setCharacter(prevCharacter);
        setActivityLogs(prevActivityLogs);
        setLevelUpData(null);
        addToast(
          'Quest Rollback',
          err.message || 'Failed to complete quest on server. Quest status restored.',
          'error'
        );
      }
    }
  };

  // Add / Create Quest
  const createQuest = async (questData) => {
    sound.playClick();
    if (user && isBackendConnected) {
      try {
        await apiFetch('/api/quests', {
          method: 'POST',
          body: JSON.stringify(questData),
        });
        await refreshDataFromApi();
        return;
      } catch {
        // Fallback
      }
    }

    const rewards = rewardsFor(questData.difficulty);
    const newQuest = {
      id: 'q-' + Date.now(),
      title: questData.title,
      description: questData.description || '',
      attribute: questData.attribute,
      difficulty: questData.difficulty,
      xpReward: rewards.xpReward,
      goldReward: rewards.goldReward,
      status: 'ACTIVE',
      recurrence: questData.recurrence || 'NONE',
      dueDate: questData.dueDate ? new Date(questData.dueDate).toISOString() : null,
      createdAt: new Date().toISOString(),
    };

    setQuests((prev) => [newQuest, ...prev]);
  };

  // Edit Quest
  const updateQuest = async (questId, questData) => {
    sound.playClick();
    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/quests/${questId}`, {
          method: 'PATCH',
          body: JSON.stringify(questData),
        });
        await refreshDataFromApi();
        return;
      } catch {
        // Fallback
      }
    }

    setQuests((prev) =>
      prev.map((q) => {
        if (q.id === questId) {
          const updatedRewards = questData.difficulty ? rewardsFor(questData.difficulty) : { xpReward: q.xpReward, goldReward: q.goldReward };
          return {
            ...q,
            ...questData,
            xpReward: updatedRewards.xpReward,
            goldReward: updatedRewards.goldReward,
          };
        }
        return q;
      })
    );
  };

  // Delete Quest
  const deleteQuest = async (questId) => {
    sound.playClick();
    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/quests/${questId}`, { method: 'DELETE' });
        await refreshDataFromApi();
        return;
      } catch {
        // Fallback
      }
    }

    setQuests((prev) => prev.filter((q) => q.id !== questId));
  };

  // Purchase Shop Item
  const purchaseShopItem = async (shopItem) => {
    if (character.gold < shopItem.cost) {
      alert('Not enough gold to purchase this item!');
      return;
    }

    sound.playPurchase();

    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/shop/${shopItem.id}/purchase`, { method: 'POST' });
        await refreshDataFromApi();
        return;
      } catch (err) {
        if (err.message) alert(err.message);
        return;
      }
    }

    // Local mode purchase
    const alreadyOwned = inventory.some((inv) => inv.itemId === shopItem.id);
    if (alreadyOwned) {
      alert('You already own this item!');
      return;
    }

    const newInvItem = {
      id: 'inv-' + Date.now(),
      itemId: shopItem.id,
      equipped: false,
      item: shopItem,
      acquiredAt: new Date().toISOString(),
    };

    setInventory((prev) => [...prev, newInvItem]);
    setCharacter((prev) => ({ ...prev, gold: prev.gold - shopItem.cost }));

    setActivityLogs((prev) => [
      {
        id: 'log-' + Date.now(),
        action: 'item_purchased',
        text: `Purchased "${shopItem.name}" for ${shopItem.cost} Gold`,
        xpDelta: 0,
        goldDelta: -shopItem.cost,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  // Equip Item
  const toggleEquipItem = async (inventoryId) => {
    sound.playClick();
    const targetInv = inventory.find((inv) => inv.id === inventoryId);
    if (!targetInv || !targetInv.item) return;

    const nextEquipped = !targetInv.equipped;

    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/inventory/${inventoryId}/equip`, {
          method: 'PATCH',
          body: JSON.stringify({ equipped: nextEquipped }),
        });
        await refreshDataFromApi();
        return;
      } catch {
        // Fallback
      }
    }

    // Local mode equip logic (unequip same type items)
    setInventory((prev) =>
      prev.map((inv) => {
        if (inv.id === inventoryId) {
          return { ...inv, equipped: nextEquipped };
        }
        if (nextEquipped && inv.item && inv.item.type === targetInv.item.type) {
          return { ...inv, equipped: false };
        }
        return inv;
      })
    );

    // Update active equipped items on character display
    if (nextEquipped) {
      if (targetInv.item.type === 'title') {
        setCharacter((prev) => ({ ...prev, equippedTitle: targetInv.item.name.replace('Title: ', '') }));
      } else if (targetInv.item.type === 'badge') {
        setCharacter((prev) => ({ ...prev, equippedBadge: targetInv.item.name }));
      } else if (targetInv.item.type === 'theme') {
        setCharacter((prev) => ({ ...prev, equippedTheme: targetInv.item.name }));
      }
    }
  };

  return (
    <GameContext.Provider
      value={{
        character,
        quests,
        shopItems,
        inventory,
        activityLogs,
        levelUpData,
        setLevelUpData,
        activeTab,
        setActiveTab,
        questFilter,
        setQuestFilter,
        selectedAttribute,
        setSelectedAttribute,
        toasts,
        addToast,
        removeToast,
        dataLoading,
        completeQuest,
        createQuest,
        updateQuest,
        deleteQuest,
        purchaseShopItem,
        toggleEquipItem,
        refreshDataFromApi,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
