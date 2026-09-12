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
  streakBonusPercent,
  applyStreakBonus,
} from '../lib/progression';

const GameContext = createContext();

const DEFAULT_ATTRIBUTES = [
  { name: 'Strength', level: 1, currentXp: 0, xpToNextLevel: 25 },
  { name: 'Intellect', level: 1, currentXp: 0, xpToNextLevel: 25 },
  { name: 'Vitality', level: 1, currentXp: 0, xpToNextLevel: 25 },
  { name: 'Discipline', level: 1, currentXp: 0, xpToNextLevel: 25 },
  { name: 'Charisma', level: 1, currentXp: 0, xpToNextLevel: 25 },
];

function createDefaultCharacter(user) {
  return {
    id: user?.id || 'hero',
    username: user?.username || 'Hero',
    email: user?.email || '',
    avatarUrl: user?.avatarUrl || null,
    level: 1,
    totalXp: 0,
    gold: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDay: null,
    xpToNextLevel: 100,
    attributes: DEFAULT_ATTRIBUTES,
    equippedTitle: null,
    equippedBadge: null,
    equippedTheme: null,
  };
}

export function GameProvider({ children }) {
  const { user, isBackendConnected } = useAuth();

  const [character, setCharacter] = useState(() => createDefaultCharacter(user));
  const [quests, setQuests] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [shopItems, setShopItems] = useState([]);

  const [levelUpData, setLevelUpData] = useState(null);
  const [activeTab, setActiveTab] = useState('quests');
  const [questFilter, setQuestFilter] = useState('active');
  const [selectedAttribute, setSelectedAttribute] = useState('ALL');
  const [toasts, setToasts] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);

  // Quest Timer State
  const [activeTimerQuest, setActiveTimerQuest] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isTimerMinimized, setIsTimerMinimized] = useState(false);

  // Completed timer quest IDs (unlocks Claim Reward on timed quests)
  const [completedTimerQuestIds, setCompletedTimerQuestIds] = useState(() => {
    try {
      const saved = localStorage.getItem('eq_completed_timer_quests');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const markTimerComplete = useCallback((quest) => {
    if (!quest?.id) return;
    setCompletedTimerQuestIds((prev) => {
      if (prev.includes(quest.id)) return prev;
      const next = [...prev, quest.id];
      try {
        localStorage.setItem('eq_completed_timer_quests', JSON.stringify(next));
      } catch {}
      return next;
    });

    sound.playLevelUp();
    confetti({
      particleCount: 130,
      spread: 85,
      origin: { y: 0.6 },
      colors: ['#f59e0b', '#fbbf24', '#10b981', '#ef4444', '#60a5fa'],
    });

    addToast(
      'Focus Complete! 🏆',
      `Timer completed for "${quest.title}"! Claim reward is now unlocked.`,
      'success',
      6000
    );
  }, []);

  const startQuestTimer = useCallback((quest, minutes = 25) => {
    sound.playClick();
    const secs = Math.max(1, minutes) * 60;
    setActiveTimerQuest(quest);
    setTimerInitialSeconds(secs);
    setTimerSeconds(secs);
    setIsTimerRunning(true);
    setIsTimerMinimized(false);
  }, []);

  const stopQuestTimer = useCallback(() => {
    sound.playClick();
    setIsTimerRunning(false);
    setActiveTimerQuest(null);
    setIsTimerMinimized(false);
  }, []);

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

  // Sync real data from API for authenticated users
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
        setCharacter(charRes.value.character);
      }

      const activeList = questActiveRes.status === 'fulfilled' ? questActiveRes.value?.quests || [] : [];
      const compList = questCompRes.status === 'fulfilled' ? questCompRes.value?.quests || [] : [];
      if (questActiveRes.status === 'fulfilled' || questCompRes.status === 'fulfilled') {
        setQuests([...activeList, ...compList]);
      }

      if (shopRes.status === 'fulfilled' && shopRes.value?.items) {
        setShopItems(shopRes.value.items);
      }

      if (invRes.status === 'fulfilled' && invRes.value?.inventory) {
        setInventory(invRes.value.inventory);
      }

      if (logsRes.status === 'fulfilled' && logsRes.value?.logs) {
        setActivityLogs(logsRes.value.logs);
      }
    } catch {
      // Backend error fallback
    } finally {
      setDataLoading(false);
    }
  }, [user, isBackendConnected]);

  // Load real data when user logs in
  useEffect(() => {
    if (user) {
      setCharacter(createDefaultCharacter(user));
      setQuests([]);
      setInventory([]);
      setActivityLogs([]);
      setShopItems([]);
      refreshDataFromApi();
    }
  }, [user, refreshDataFromApi]);

  // Derive equipped items from inventory
  const equippedTitle = inventory.find((i) => i.equipped && i.item?.type === 'title')?.item?.name?.replace('Title: ', '') || null;
  const equippedBadge = inventory.find((i) => i.equipped && i.item?.type === 'badge')?.item?.name || null;
  const equippedTheme = inventory.find((i) => i.equipped && i.item?.type === 'theme')?.item?.name || null;

  const activeCharacter = {
    ...character,
    equippedTitle: equippedTitle || character.equippedTitle || null,
    equippedBadge: equippedBadge || character.equippedBadge || null,
    equippedTheme: equippedTheme || character.equippedTheme || null,
  };

  // --- ACTIONS ---

  // Complete Quest (Optimistic with Rollback)
  const completeQuest = async (questId) => {
    sound.playQuestComplete();

    const targetQuest = quests.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.status === 'COMPLETED') return;

    const prevQuests = quests;
    const prevCharacter = character;
    const prevActivityLogs = activityLogs;

    // Optimistically calculate rewards
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

    setCompletedTimerQuestIds((prev) => {
      const next = prev.filter((id) => id !== questId);
      try {
        localStorage.setItem('eq_completed_timer_quests', JSON.stringify(next));
      } catch {}
      return next;
    });

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
    const rewards = rewardsFor(questData.difficulty || 'EASY');
    const cleanPayload = {
      title: questData.title.trim(),
      description: questData.description ? questData.description.trim() : null,
      attribute: questData.attribute,
      difficulty: questData.difficulty || 'EASY',
      recurrence: questData.recurrence || 'NONE',
      dueDate: questData.dueDate ? new Date(questData.dueDate).toISOString() : null,
    };

    if (user && isBackendConnected) {
      try {
        const res = await apiFetch('/api/quests', {
          method: 'POST',
          body: JSON.stringify(cleanPayload),
        });
        if (res?.quest) {
          setQuests((prev) => [res.quest, ...prev.filter((q) => q.id !== res.quest.id)]);
        }
        await refreshDataFromApi();
        addToast('Quest Forged', `"${cleanPayload.title}" added to your scroll.`, 'success');
        return res?.quest;
      } catch (err) {
        // If server fails or is temporarily unreachable, create locally so player never loses work
        const localQuest = {
          id: 'quest-' + Date.now(),
          userId: character.id,
          title: cleanPayload.title,
          description: cleanPayload.description,
          attribute: cleanPayload.attribute,
          difficulty: cleanPayload.difficulty,
          xpReward: rewards.xp,
          goldReward: rewards.gold,
          status: 'ACTIVE',
          recurrence: cleanPayload.recurrence,
          dueDate: cleanPayload.dueDate,
          createdAt: new Date().toISOString(),
        };
        setQuests((prev) => [localQuest, ...prev]);
        addToast('Quest Forged', `"${cleanPayload.title}" added to your scroll.`, 'success');
        return localQuest;
      }
    } else {
      // Local / demo mode
      const localQuest = {
        id: 'quest-' + Date.now(),
        userId: character.id,
        title: cleanPayload.title,
        description: cleanPayload.description,
        attribute: cleanPayload.attribute,
        difficulty: cleanPayload.difficulty,
        xpReward: rewards.xp,
        goldReward: rewards.gold,
        status: 'ACTIVE',
        recurrence: cleanPayload.recurrence,
        dueDate: cleanPayload.dueDate,
        createdAt: new Date().toISOString(),
      };
      setQuests((prev) => [localQuest, ...prev]);
      addToast('Quest Forged', `"${cleanPayload.title}" added to your scroll.`, 'success');
      return localQuest;
    }
  };

  // Edit Quest
  const updateQuest = async (questId, questData) => {
    sound.playClick();
    const cleanPayload = {
      title: questData.title?.trim(),
      description: questData.description ? questData.description.trim() : null,
      attribute: questData.attribute,
      difficulty: questData.difficulty,
      recurrence: questData.recurrence,
      dueDate: questData.dueDate ? new Date(questData.dueDate).toISOString() : null,
    };

    setQuests((prev) =>
      prev.map((q) => (q.id === questId ? { ...q, ...cleanPayload } : q))
    );

    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/quests/${questId}`, {
          method: 'PATCH',
          body: JSON.stringify(cleanPayload),
        });
        await refreshDataFromApi();
        addToast('Quest Updated', 'Quest details updated.', 'info');
      } catch (err) {
        addToast('Warning', 'Saved locally. Server update failed.', 'warning');
      }
    } else {
      addToast('Quest Updated', 'Quest details updated.', 'info');
    }
  };

  // Delete Quest
  const deleteQuest = async (questId) => {
    sound.playClick();
    setQuests((prev) => prev.filter((q) => q.id !== questId));

    if (activeTimerQuest?.id === questId) {
      stopQuestTimer();
    }

    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/quests/${questId}`, { method: 'DELETE' });
        await refreshDataFromApi();
        addToast('Quest Removed', 'Quest removed from scroll.', 'info');
      } catch (err) {
        addToast('Warning', 'Removed locally. Server delete failed.', 'warning');
      }
    } else {
      addToast('Quest Removed', 'Quest removed from scroll.', 'info');
    }
  };

  // Purchase Shop Item
  const purchaseShopItem = async (shopItem) => {
    if (character.gold < shopItem.cost) {
      addToast('Insufficient Gold', `You need ${shopItem.cost} Gold to acquire this item.`, 'error');
      return;
    }

    sound.playPurchase();

    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/shop/${shopItem.id}/purchase`, { method: 'POST' });
        await refreshDataFromApi();
        addToast('Item Acquired', `You have unlocked "${shopItem.name}"!`, 'success');
        return;
      } catch (err) {
        addToast('Purchase Failed', err.message || 'Could not complete transaction', 'error');
        return;
      }
    }
  };

  // Equip Item
  const toggleEquipItem = async (inventoryId) => {
    sound.playClick();
    const targetInv = inventory.find((inv) => inv.id === inventoryId);
    if (!targetInv) return;

    const nextEquipped = !targetInv.equipped;

    if (user && isBackendConnected) {
      try {
        await apiFetch(`/api/inventory/${inventoryId}/equip`, {
          method: 'PATCH',
          body: JSON.stringify({ equipped: nextEquipped }),
        });
        await refreshDataFromApi();
        return;
      } catch (err) {
        addToast('Equip Error', err.message || 'Failed to equip item', 'error');
        return;
      }
    }
  };

  return (
    <GameContext.Provider
      value={{
        character: activeCharacter,
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
        // Timer
        activeTimerQuest,
        timerSeconds,
        setTimerSeconds,
        timerInitialSeconds,
        setTimerInitialSeconds,
        isTimerRunning,
        setIsTimerRunning,
        isTimerMinimized,
        setIsTimerMinimized,
        startQuestTimer,
        stopQuestTimer,
        completedTimerQuestIds,
        markTimerComplete,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
