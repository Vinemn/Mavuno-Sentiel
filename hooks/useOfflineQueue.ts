import { useState, useEffect, useCallback } from 'react';

type QueueItem<T> = {
  id: string;
  payload: T;
  timestamp: number;
};

type AsyncProcessor<T> = (item: T) => Promise<boolean>;

export const useOfflineQueue = <T>(queueName: string, processor: AsyncProcessor<T>) => {
  const [queue, setQueue] = useState<QueueItem<T>[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Load queue from localStorage on mount
  useEffect(() => {
    try {
      const storedQueue = localStorage.getItem(queueName);
      if (storedQueue) {
        setQueue(JSON.parse(storedQueue));
      }
    } catch (error) {
      console.error("Failed to load offline queue from localStorage", error);
    }
  }, [queueName]);

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(queueName, JSON.stringify(queue));
    } catch (error) {
      console.error("Failed to save offline queue to localStorage", error);
    }
  }, [queue, queueName]);

  const processQueue = useCallback(async () => {
    if (isProcessing || !navigator.onLine || queue.length === 0) {
      return;
    }

    setIsProcessing(true);
    const itemToProcess = queue[0];

    try {
      const success = await processor(itemToProcess.payload);
      if (success) {
        // Remove item from queue on successful processing
        setQueue(prevQueue => prevQueue.slice(1));
      }
    } catch (error) {
      console.error("Error processing queue item:", error);
      // Decide on error handling: retry, move to a failed queue, etc.
      // For now, we'll just log it and stop processing to prevent loops.
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, queue, processor]);
  
  // Process queue when it has items and we are online
  useEffect(() => {
    if (queue.length > 0) {
      processQueue();
    }
  }, [queue.length, processQueue]);

  // Listen for online/offline events
  useEffect(() => {
    window.addEventListener('online', processQueue);
    return () => {
      window.removeEventListener('online', processQueue);
    };
  }, [processQueue]);

  const addItem = (payload: T) => {
    const newItem: QueueItem<T> = {
      id: `${new Date().getTime()}-${Math.random()}`,
      payload,
      timestamp: new Date().getTime(),
    };
    setQueue(prevQueue => [...prevQueue, newItem]);
  };

  return {
    addItem,
    queue,
    isProcessing,
    queueLength: queue.length,
  };
};