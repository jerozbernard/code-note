export type CodeNote = {
  id: string;
  title: string;
  code: string;
  author: string;
  createdAt: string;
  updatedAt: string;
};

export type ActionState = {
  error?: string;
  success?: string;
};
