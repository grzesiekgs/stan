export type TaskQueue<TaskData> = {
  scheduleTask: (taskData: TaskData) => void;
};

export const createTaskQueue = (tasksExecutor: task) => {
  const jobs = new Set<VoidFunction>();
  return {
    schedule,
  };
};

const p = Promise.withResolvers;
