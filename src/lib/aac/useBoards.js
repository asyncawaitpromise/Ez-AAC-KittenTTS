import { useCallback, useEffect, useState } from 'react';
import * as store from './boards';

export function useBoards() {
  const [boards, setBoards] = useState(store.loadBoards);
  const [activeBoardId, setActiveBoardId] = useState(() => store.loadActiveBoardId(store.loadBoards()));

  useEffect(() => store.saveBoards(boards), [boards]);
  useEffect(() => store.saveActiveBoardId(activeBoardId), [activeBoardId]);

  const activeBoard = boards.find((b) => b.id === activeBoardId) ?? boards[0];

  // Creation/deletion also touch which board is active, so they read the
  // current render's state directly rather than going through a functional
  // updater — simpler than threading the new/next id back out of one.
  const createBoard = useCallback(
    (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const board = { id: store.uid('board'), name: trimmed, categories: [] };
      setBoards([...boards, board]);
      setActiveBoardId(board.id);
    },
    [boards]
  );

  const deleteBoard = useCallback(
    (id) => {
      if (boards.length <= 1) return;
      const next = boards.filter((b) => b.id !== id);
      setBoards(next);
      if (activeBoardId === id) setActiveBoardId(next[0].id);
    },
    [boards, activeBoardId]
  );

  const renameBoard = useCallback((id, name) => setBoards((bs) => store.renameBoard(bs, id, name)), []);
  const addCategory = useCallback(
    (boardId, category) => setBoards((bs) => store.addCategory(bs, boardId, category)),
    []
  );
  const removeCategory = useCallback(
    (boardId, categoryId) => setBoards((bs) => store.removeCategory(bs, boardId, categoryId)),
    []
  );
  const addWord = useCallback(
    (boardId, categoryId, word) => setBoards((bs) => store.addWord(bs, boardId, categoryId, word)),
    []
  );
  const removeWord = useCallback(
    (boardId, categoryId, wordId) => setBoards((bs) => store.removeWord(bs, boardId, categoryId, wordId)),
    []
  );

  return {
    boards,
    activeBoard,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    deleteBoard,
    renameBoard,
    addCategory,
    removeCategory,
    addWord,
    removeWord,
  };
}
