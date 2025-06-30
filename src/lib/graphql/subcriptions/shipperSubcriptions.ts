import { gql } from "@apollo/client";

// Define the subscription
export const SHIPPER_LOCATION_SUBSCRIPTION = gql`
subscription($shipperId: ID!) {
    shipperLocationUpdated(shipperId: $shipperId) {
      shipperId
      latitude
      longitude
      updatedAt
    }
  }
`;