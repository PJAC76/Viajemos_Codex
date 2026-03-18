import { notifications } from "../mocks/db";

export const notificationsService = {
  listForUser(userId: string) {
    return notifications.filter((item) => item.userId === userId);
  }
};
