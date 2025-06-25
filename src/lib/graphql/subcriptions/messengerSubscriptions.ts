import { gql } from '@apollo/client';

export const MESSAGE_SENT_SUBSCRIPTION = gql`
  subscription MessageSent($conversationId: String!) {
    messageSent(conversationId: $conversationId) {
      id
      content
      messageType
      attachmentUrl
      attachmentType
      isRead
      readAt
      isEdited
      editedAt
      isDeleted
      deletedAt
      createdAt
      updatedAt
      metadata
      replyToMessageId
      sender {
        id
        name
        email
        avatar
        phone
      }
      conversation {
        id
        conversationType
        orderId
        restaurantId
      }
    }
  }
`;

// export const CONVERSATION_CREATED_SUBSCRIPTION = gql`
//   subscription ConversationCreated {
//     conversationCreated {
//       id
//       lastMessage
//       lastMessageAt
//       isBlocked
//       blockedBy
//       createdAt
//       updatedAt
//       conversationType
//       orderId
//       restaurantId
//       participant1 {
//         id
//         name
//         email
//         avatar
//         phone
//       }
//       participant2 {
//         id
//         name
//         email
//         avatar
//         phone
//       }
//     }
//   }
// `;

export const MESSAGES_READ_SUBSCRIPTION = gql`
  subscription MessagesRead($conversationId: String!) {
    messagesRead(conversationId: $conversationId)
  }
`;