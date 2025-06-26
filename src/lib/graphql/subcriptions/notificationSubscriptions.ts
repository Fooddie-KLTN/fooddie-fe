import { gql } from "@apollo/client";

export const NOTIFICATION_ADDED_SUBSCRIPTION = gql`
  subscription NotificationAdded {
    notificationAdded {
      id
      content
      description
      createdAt
      isRead
      type
      receiveUser
    }
  }
`;