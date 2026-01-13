import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, MapPin, BarChart3, RefreshCw, Check, ChevronDown, ChevronUp, Save, Trash2, Download, Upload } from 'lucide-react';

const ParkGolfTracker = () => {
  const courses = ['1차', '2차', '3차', '4차', '5차', '6차', '7차', '8차', '9차'];
  const holes = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  
  const [players, setPlayers] = useState(['플레이어 1', '플레이어 2', '플레이어 3', '플레이어 4', '플레이어 5', '플레이어 6']);
  const [activePlayers, setActivePlayers] = useState(['플레이어 1', '플레이어 2', '플레이어 3', '플레이어 4', '플레이어 5', '플레이어 6']);
  const [currentCourse, setCurrentCourse] = useState('1차');
  const [winners, setWinners] = useState({});
  const [showStats, setShowStats] = useState(false);
  const [editingPlayers, setEditingPlayers] = useState(false);
  const [tempPlayers, setTempPlayers] = useState([...players]);
  const [openHole, setOpenHole] = useState(null);
  const [penaltyPerHole, setPenaltyPerHole] = useState(500);
  const [editingPenalty, setEditingPenalty] = useState(false);
  const [gameHistory, setGameHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

//하얀화면만 안나오게 추가
const storage = {
  get: async (key) => {
    const value = localStorage.getItem(key);
    return value ? { value } : null;
  },
  set: async (key, value) => {
    localStorage.setItem(key, value);
  },
  delete: async (key) => {
    localStorage.removeItem(key);
  }
};

window.storage = storage;  


  // Load data from storage with error handling
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load players
        try {
          const savedPlayers = await window.storage.get('parkgolf-players', false);
          if (savedPlayers) {
            const playerData = JSON.parse(savedPlayers.value);
            setPlayers(playerData);
            setTempPlayers(playerData);
          }
        } catch (e) {
          console.log('No saved players, using defaults');
        }

        // Load active players
        try {
          const savedActivePlayers = await window.storage.get('parkgolf-active-players', false);
          if (savedActivePlayers) {
            setActivePlayers(JSON.parse(savedActivePlayers.value));
          }
        } catch (e) {
          console.log('No saved active players, using all players');
        }

        // Load winners
        try {
          const savedWinners = await window.storage.get('parkgolf-winners', false);
          if (savedWinners) {
            setWinners(JSON.parse(savedWinners.value));
          }
        } catch (e) {
          console.log('No saved winners');
        }

        // Load penalty
        try {
          const savedPenalty = await window.storage.get('parkgolf-penalty', false);
          if (savedPenalty) {
            setPenaltyPerHole(JSON.parse(savedPenalty.value));
          }
        } catch (e) {
          console.log('No saved penalty, using default');
        }

        // Load history
        try {
          const savedHistory = await window.storage.get('parkgolf-history', false);
          if (savedHistory) {
            setGameHistory(JSON.parse(savedHistory.value));
          }
        } catch (e) {
          console.log('No saved history');
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // Debounced save function
  const saveData = useCallback(async () => {
    try {
      await Promise.all([
        window.storage.set('parkgolf-players', JSON.stringify(players), false),
        window.storage.set('parkgolf-active-players', JSON.stringify(activePlayers), false),
        window.storage.set('parkgolf-winners', JSON.stringify(winners), false),
        window.storage.set('parkgolf-penalty', JSON.stringify(penaltyPerHole), false)
      ]);
    } catch (e) {
      console.error('Failed to save data:', e);
    }
  }, [players, activePlayers, winners, penaltyPerHole]);

  useEffect(() => {
    if (!isLoading) {
      saveData();
    }
  }, [players, winners, penaltyPerHole, isLoading, saveData]);

  const handleWinnerToggle = (hole, winner) => {
    const key = `${currentCourse}-${hole}`;
    const currentWinners = winners[key] || [];
    
    // Special option handling
    if (winner === '무승부' || winner === '모두실패') {
      setWinners(prev => ({
        ...prev,
        [key]: [winner]
      }));
      return;
    }
    
    // Remove special options if present
    if (currentWinners.includes('무승부') || currentWinners.includes('모두실패')) {
      setWinners(prev => ({
        ...prev,
        [key]: [winner]
      }));
      return;
    }
    
    // Toggle regular player
    let newWinners;
    if (currentWinners.includes(winner)) {
      newWinners = currentWinners.filter(w => w !== winner);
    } else {
      newWinners = [...currentWinners, winner];
    }
    
    if (newWinners.length === 0) {
      const { [key]: removed, ...rest } = winners;
      setWinners(rest);
    } else {
      setWinners(prev => ({
        ...prev,
        [key]: newWinners
      }));
    }
  };

  const calculateStats = () => {
    const stats = {};
    activePlayers.forEach(player => {
      stats[player] = 0;
    });
    
    stats['무승부'] = 0;
    stats['모두실패'] = 0;
    
    Object.values(winners).forEach(winnerList => {
      if (Array.isArray(winnerList)) {
        winnerList.forEach(winner => {
          if (stats[winner] !== undefined) {
            stats[winner]++;
          }
        });
      }
    });
    
    const totalHoles = Object.keys(winners).length;
    return { stats, totalHoles };
  };

  const handleSavePlayers = () => {
    // Validate that all players have names
    const validPlayers = tempPlayers.filter(p => p.trim() !== '');
    if (validPlayers.length < 2) {
      alert('최소 2명의 플레이어가 필요합니다.');
      return;
    }
    if (validPlayers.length > 6) {
      alert('최대 6명까지 설정 가능합니다.');
      return;
    }
    setPlayers([...validPlayers]);
    
    // Update active players to only include valid players
    setActivePlayers(prev => prev.filter(p => validPlayers.includes(p)));
    
    setEditingPlayers(false);
  };

  const handleReset = async () => {
    if (window.confirm('현재 게임 기록을 초기화하시겠습니까? (저장된 게임 기록은 유지됩니다)')) {
      setWinners({});
      setOpenHole(null);
      try {
        await window.storage.delete('parkgolf-winners', false);
      } catch (e) {
        console.log('No data to delete');
      }
    }
  };

  const saveGameToHistory = async () => {
    if (Object.keys(winners).length === 0) {
      alert('기록할 게임 데이터가 없습니다.');
      return;
    }

    const { stats, totalHoles } = calculateStats();
    
    // Extract played courses
    const playedCourses = new Set();
    Object.keys(winners).forEach(key => {
      const course = key.split('-')[0];
      playedCourses.add(course);
    });

    const gameRecord = {
      id: Date.now(),
      date: new Date().toISOString(),
      players: [...activePlayers],
      totalCourses: playedCourses.size,
      totalHoles,
      stats: { ...stats },
      penaltyPerHole,
      winners: { ...winners }
    };

    const newHistory = [gameRecord, ...gameHistory];
    setGameHistory(newHistory);

    try {
      await window.storage.set('parkgolf-history', JSON.stringify(newHistory), false);
      alert('게임이 저장되었습니다!');
      
      // Reset current game
      setWinners({});
      setShowStats(false);
      setOpenHole(null);
    } catch (e) {
      console.error('Failed to save game:', e);
      alert('게임 저장에 실패했습니다.');
    }
  };

  const deleteGame = async (gameId) => {
    if (window.confirm('이 게임 기록을 삭제하시겠습니까?')) {
      const newHistory = gameHistory.filter(g => g.id !== gameId);
      setGameHistory(newHistory);
      try {
        await window.storage.set('parkgolf-history', JSON.stringify(newHistory), false);
      } catch (e) {
        console.error('Failed to delete game:', e);
        alert('게임 삭제에 실패했습니다.');
      }
    }
  };

  const clearAllHistory = async () => {
    if (window.confirm('모든 게임 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setGameHistory([]);
      try {
        await window.storage.delete('parkgolf-history', false);
        alert('모든 게임 기록이 삭제되었습니다.');
      } catch (e) {
        console.error('Failed to clear history:', e);
      }
    }
  };

  // Export data as JSON
  const exportData = () => {
    const exportObj = {
      players,
      activePlayers,
      winners,
      penaltyPerHole,
      gameHistory,
      exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(exportObj, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `parkgolf-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON
  const importData = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const imported = JSON.parse(e.target.result);
        
        if (window.confirm('데이터를 가져오시겠습니까? 현재 데이터는 덮어쓰여집니다.')) {
          if (imported.players) setPlayers(imported.players);
          if (imported.activePlayers) setActivePlayers(imported.activePlayers);
          if (imported.winners) setWinners(imported.winners);
          if (imported.penaltyPerHole) setPenaltyPerHole(imported.penaltyPerHole);
          if (imported.gameHistory) setGameHistory(imported.gameHistory);
          
          alert('데이터를 성공적으로 가져왔습니다!');
        }
      } catch (error) {
        alert('파일을 읽는 중 오류가 발생했습니다.');
        console.error('Import error:', error);
      }
    };
    reader.readAsText(file);
  };

  const { stats, totalHoles } = calculateStats();
  const sortedPlayers = [...activePlayers].sort((a, b) => (stats[b] || 0) - (stats[a] || 0));
  const specialStats = [
    { label: '무승부', value: stats['무승부'] || 0 },
    { label: '모두실패', value: stats['모두실패'] || 0 }
  ];

  // Quick navigation to next empty hole
  const navigateToNextEmptyHole = () => {
    for (let hole of holes) {
      const key = `${currentCourse}-${hole}`;
      if (!winners[key] || winners[key].length === 0) {
        setOpenHole(hole);
        // Scroll to hole
        setTimeout(() => {
          const element = document.getElementById(`hole-${hole}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
        return;
      }
    }
    alert('이 코스의 모든 홀이 기록되었습니다!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 font-medium">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-4 py-6 shadow-lg sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Trophy className="w-8 h-8" />
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'system-ui, sans-serif' }}>파크골프</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="현재 게임 초기화"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            <button
              onClick={exportData}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="데이터 내보내기"
            >
              <Download className="w-5 h-5" />
            </button>
            <label className="p-2 hover:bg-white/20 rounded-lg transition-colors cursor-pointer" title="데이터 가져오기">
              <Upload className="w-5 h-5" />
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
        </div>
        <p className="text-emerald-100 text-sm">1등 기록 및 벌금 계산</p>
      </div>

      <div className="p-4 space-y-4 pb-20">
        {/* Quick Info Banner */}
        {totalHoles > 0 && (
          <div className="bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl shadow-md p-4 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm opacity-90">현재 게임 진행 중</div>
                <div className="text-2xl font-bold">{totalHoles} 홀 기록됨</div>
              </div>
              <button
                onClick={navigateToNextEmptyHole}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors text-sm font-medium"
              >
                다음 홀로 →
              </button>
            </div>
          </div>
        )}

        {/* Players Section */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <h2 className="font-bold text-lg">플레이어 관리</h2>
            </div>
          </div>
          
          <div className="space-y-3">
            {players.map((player, idx) => {
              const isActive = activePlayers.includes(player);
              return (
                <div key={idx} className="flex gap-2 items-center">
                  {editingPlayers ? (
                    <>
                      <input
                        type="text"
                        value={tempPlayers[idx]}
                        onChange={(e) => {
                          const newPlayers = [...tempPlayers];
                          newPlayers[idx] = e.target.value;
                          setTempPlayers(newPlayers);
                        }}
                        className="flex-1 px-4 py-3 border-2 border-emerald-200 rounded-lg focus:border-emerald-500 focus:outline-none text-base"
                        placeholder={`플레이어 ${idx + 1}`}
                      />
                      {tempPlayers.length > 2 && (
                        <button
                          onClick={() => {
                            const newPlayers = tempPlayers.filter((_, i) => i !== idx);
                            setTempPlayers(newPlayers);
                          }}
                          className="px-3 py-3 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <label
                        className={`flex-1 flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-500'
                            : 'bg-gray-50 border-2 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setActivePlayers([...activePlayers, player]);
                            } else {
                              if (activePlayers.length <= 1) {
                                alert('최소 1명은 선택되어야 합니다.');
                                return;
                              }
                              setActivePlayers(activePlayers.filter(p => p !== player));
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <span className={`font-medium flex-1 ${isActive ? 'text-emerald-900' : 'text-gray-700'}`}>
                          {player}
                        </span>
                        {isActive && (
                          <Check className="w-5 h-5 text-emerald-600" />
                        )}
                      </label>
                    </>
                  )}
                </div>
              );
            })}
            
            {editingPlayers && tempPlayers.length < 6 && (
              <button
                onClick={() => setTempPlayers([...tempPlayers, `플레이어 ${tempPlayers.length + 1}`])}
                className="w-full py-3 border-2 border-dashed border-emerald-300 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors font-medium"
              >
                + 플레이어 추가 (최대 6명)
              </button>
            )}
            
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  if (editingPlayers) {
                    handleSavePlayers();
                  } else {
                    setEditingPlayers(true);
                    setTempPlayers([...players]);
                  }
                }}
                className="flex-1 px-4 py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1"
              >
                {editingPlayers ? (
                  <>
                    <Check className="w-5 h-5" />
                    이름 저장
                  </>
                ) : (
                  '이름 수정'
                )}
              </button>
              
              {editingPlayers && (
                <button
                  onClick={() => {
                    setEditingPlayers(false);
                    setTempPlayers([...players]);
                  }}
                  className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
              )}
            </div>
            
            {!editingPlayers && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-700 text-center">
                  오늘 참여: <span className="font-bold">{activePlayers.length}명</span> / 전체: <span className="font-bold">{players.length}명</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Course Selection */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h2 className="font-bold text-lg">코스 선택</h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {courses.map(course => {
              // Calculate completion for each course
              const courseHoles = holes.filter(hole => winners[`${course}-${hole}`]);
              const completion = (courseHoles.length / holes.length) * 100;
              
              return (
                <button
                  key={course}
                  onClick={() => {
                    setCurrentCourse(course);
                    setOpenHole(null);
                  }}
                  className={`relative py-4 rounded-lg font-bold text-lg transition-all ${
                    currentCourse === course
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-600 text-white shadow-lg scale-105'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {course}
                  {completion > 0 && (
                    <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 w-12 h-1.5 bg-white/30 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white/80 rounded-full transition-all"
                        style={{ width: `${completion}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Holes Section */}
        <div className="bg-white rounded-2xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-lg">코스 {currentCourse} - 홀별 1등</h2>
            <button
              onClick={navigateToNextEmptyHole}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
            >
              다음 빈 홀 →
            </button>
          </div>
          <div className="space-y-2">
            {holes.map(hole => {
              const key = `${currentCourse}-${hole}`;
              const currentWinners = winners[key] || [];
              const hasWinners = currentWinners.length > 0;
              const isOpen = openHole === hole;
              
              return (
                <div key={hole} id={`hole-${hole}`} className="border-2 border-emerald-100 rounded-xl overflow-hidden transition-all">
                  {/* Hole header - clickable */}
                  <button
                    onClick={() => setOpenHole(isOpen ? null : hole)}
                    className="w-full flex items-center justify-between p-4 hover:bg-emerald-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-emerald-800 text-lg">홀 {hole}</span>
                      {hasWinners && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">
                            {currentWinners.join(', ')}
                          </span>
                        </div>
                      )}
                    </div>
                    {isOpen ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {/* Hole content - shown when expanded */}
                  {isOpen && (
                    <div className="px-4 pb-4 border-t border-emerald-100 pt-4 bg-gradient-to-b from-emerald-50/50 to-transparent">
                      {/* Player selection */}
                      <div className="space-y-2 mb-3">
                        {activePlayers.map(player => {
                          const isSelected = currentWinners.includes(player);
                          return (
                            <label
                              key={player}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-gradient-to-r from-emerald-100 to-teal-100 border-2 border-emerald-500'
                                  : 'bg-white border-2 border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => handleWinnerToggle(hole, player)}
                                className="w-5 h-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                              />
                              <span className={`font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>
                                {player}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                      
                      {/* Special options */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                        {['무승부', '모두실패'].map(option => {
                          const isSelected = currentWinners.includes(option);
                          return (
                            <button
                              key={option}
                              onClick={() => handleWinnerToggle(hole, option)}
                              className={`py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                                isSelected
                                  ? 'bg-amber-500 text-white shadow-md'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                            >
                              {option}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setShowStats(!showStats)}
            className="py-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <BarChart3 className="w-6 h-6" />
            {showStats ? '통계 숨기기' : '통계 보기'}
          </button>

          <button
            onClick={() => setShowHistory(!showHistory)}
            className="py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-6 h-6" />
            {showHistory ? '기록 숨기기' : '게임 기록'}
          </button>
        </div>

        {/* Statistics */}
        {showStats && (
          <>
            <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl shadow-lg p-5 border-2 border-yellow-200">
              <h2 className="font-bold text-xl mb-4 text-center text-amber-900">🏆 최종 통계</h2>
              
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <p className="text-center text-lg">
                  <span className="font-bold text-emerald-700">총 게임 홀 수:</span>
                  <span className="ml-2 text-2xl font-bold text-emerald-900">{totalHoles}</span>
                  <span className="text-gray-500 ml-1">홀</span>
                </p>
              </div>

              <div className="space-y-3">
                {sortedPlayers.map((player, idx) => {
                  const wins = stats[player] || 0;
                  const percentage = totalHoles > 0 ? ((wins / totalHoles) * 100).toFixed(1) : 0;
                  
                  return (
                    <div key={player} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '🏅'}
                          </span>
                          <span className="font-bold text-lg">{player}</span>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-700">{wins}</div>
                          <div className="text-xs text-gray-500">{percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                
                {/* Special statistics */}
                {(specialStats[0].value > 0 || specialStats[1].value > 0) && (
                  <>
                    <div className="border-t-2 border-amber-200 my-3 pt-3">
                      <h3 className="text-sm font-bold text-amber-900 mb-2">기타 통계</h3>
                    </div>
                    {specialStats.map(({ label, value }) => {
                      if (value === 0) return null;
                      const percentage = totalHoles > 0 ? ((value / totalHoles) * 100).toFixed(1) : 0;
                      
                      return (
                        <div key={label} className="bg-amber-50 rounded-xl p-4 shadow-sm border border-amber-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{label === '무승부' ? '🤝' : '❌'}</span>
                              <span className="font-bold text-amber-900">{label}</span>
                            </div>
                            <div className="text-right">
                              <div className="text-xl font-bold text-amber-700">{value}</div>
                              <div className="text-xs text-amber-600">{percentage}%</div>
                            </div>
                          </div>
                          <div className="w-full bg-amber-200 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            {/* Penalty Section */}
            <div className="bg-gradient-to-br from-red-50 to-rose-50 rounded-2xl shadow-lg p-5 border-2 border-red-200">
              <h2 className="font-bold text-xl mb-4 text-center text-red-900">💰 벌금 계산</h2>
              
              {/* Penalty amount setting */}
              <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-gray-700">1등 실패 홀당 벌금</span>
                  {!editingPenalty && (
                    <button
                      onClick={() => setEditingPenalty(true)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                    >
                      수정
                    </button>
                  )}
                </div>
                {editingPenalty ? (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={penaltyPerHole}
                      onChange={(e) => setPenaltyPerHole(Number(e.target.value))}
                      className="flex-1 px-4 py-3 border-2 border-red-200 rounded-lg focus:border-red-500 focus:outline-none text-base"
                      placeholder="벌금 단가"
                    />
                    <button
                      onClick={() => setEditingPenalty(false)}
                      className="px-4 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      <Check className="w-4 h-4" /> 저장
                    </button>
                  </div>
                ) : (
                  <div className="text-center">
                    <span className="text-3xl font-bold text-red-700">{penaltyPerHole.toLocaleString()}</span>
                    <span className="text-gray-600 ml-1">원</span>
                  </div>
                )}
              </div>

              {/* Per-player penalties */}
              <div className="space-y-3">
                {sortedPlayers.map((player) => {
                  const wins = stats[player] || 0;
                  const lostHoles = totalHoles - wins;
                  const penalty = lostHoles * penaltyPerHole;
                  
                  return (
                    <div key={player} className="bg-white rounded-xl p-4 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-lg">{player}</span>
                        <div className="text-right">
                          <div className="text-sm text-gray-600 mb-1">
                            {lostHoles}홀 × {penaltyPerHole.toLocaleString()}원
                          </div>
                          <div className="text-2xl font-bold text-red-700">{penalty.toLocaleString()}원</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total penalty */}
              <div className="bg-gradient-to-r from-red-600 to-rose-600 rounded-xl p-4 mt-4 shadow-lg">
                <div className="flex items-center justify-between text-white">
                  <span className="font-bold text-lg">총 벌금 합계</span>
                  <span className="text-3xl font-bold">
                    {sortedPlayers.reduce((sum, player) => {
                      const wins = stats[player] || 0;
                      const lostHoles = totalHoles - wins;
                      return sum + (lostHoles * penaltyPerHole);
                    }, 0).toLocaleString()}원
                  </span>
                </div>
              </div>

              {/* Save game button */}
              <button
                onClick={saveGameToHistory}
                className="w-full mt-4 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-6 h-6" />
                게임 저장하기
              </button>
            </div>
          </>
        )}

        {/* Game History */}
        {showHistory && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-5 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-xl text-purple-900">📋 게임 기록</h2>
              {gameHistory.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  전체 삭제
                </button>
              )}
            </div>
            
            {gameHistory.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center">
                <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">저장된 게임 기록이 없습니다.</p>
                <p className="text-sm text-gray-400 mt-2">게임을 완료하고 저장 버튼을 누르세요.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gameHistory.map((game, index) => {
                  const gameDate = new Date(game.date);
                  const dateStr = gameDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  });
                  const timeStr = gameDate.toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div key={game.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                      {/* Header */}
                      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-lg">{dateStr}</div>
                            <div className="text-sm text-purple-100">{timeStr}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-purple-100">게임 #{gameHistory.length - index}</div>
                          </div>
                        </div>
                      </div>

                      {/* Game info */}
                      <div className="p-4">
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <div className="text-sm text-gray-600 mb-1">총 코스 수</div>
                            <div className="text-2xl font-bold text-purple-700">{game.totalCourses}</div>
                          </div>
                          <div className="bg-pink-50 rounded-lg p-3 text-center">
                            <div className="text-sm text-gray-600 mb-1">총 홀 수</div>
                            <div className="text-2xl font-bold text-pink-700">{game.totalHoles}</div>
                          </div>
                        </div>

                        {/* Per-player statistics */}
                        <div className="space-y-2">
                          <h3 className="font-bold text-gray-700 mb-2">플레이어별 결과</h3>
                          {game.players.map(player => {
                            const wins = game.stats[player] || 0;
                            const lostHoles = game.totalHoles - wins;
                            const penalty = lostHoles * game.penaltyPerHole;
                            
                            return (
                              <div key={player} className="bg-gray-50 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800">{player}</span>
                                  <span className="text-sm text-emerald-600 font-medium">
                                    🏆 {wins}회
                                  </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                  <span className="text-gray-600">
                                    {lostHoles}홀 × {game.penaltyPerHole.toLocaleString()}원
                                  </span>
                                  <span className="font-bold text-red-600">
                                    {penalty.toLocaleString()}원
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => deleteGame(game.id)}
                          className="w-full mt-3 py-2 bg-red-100 text-red-600 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          기록 삭제
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkGolfTracker;
