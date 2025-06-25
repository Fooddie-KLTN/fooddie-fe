// apolloClient.js
import { ApolloClient, InMemoryCache, split, HttpLink } from '@apollo/client';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { createClient } from 'graphql-ws';
import { getMainDefinition } from '@apollo/client/utilities';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
const backendUrl = process.env.NEXT_PUBLIC_API_URL_DOMAIN_BE;

// Improved token function with better error handling
function getToken() {
  if (typeof window !== 'undefined') {
    try {
      return localStorage.getItem('authToken');
    } catch (error) {
      console.warn('Failed to get token from localStorage:', error);
      return null;
    }
  }
  return null;
}

// HTTP Link with dynamic headers function
const httpLink = new HttpLink({
  uri: `${apiBaseUrl}/graphql`,
  headers: (() => {
    const token = getToken();
    return token
      ? { Authorization: `Bearer ${token}` }
      : undefined;
  })(),
});

// WebSocket Link with better error handling and dynamic token
const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(createClient({
    url: `ws://${backendUrl}/graphql`,
    connectionParams: () => {
      const token = getToken();
      if (!token) {
        console.warn('No token found for WebSocket connection');
      }
      return token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {};
    },
    on: {
      error: (error) => {
        console.error('WebSocket error:', error);
      },
      closed: (event) => {
        console.log('WebSocket closed:', event);
      },
      connected: () => {
        console.log('WebSocket connected');
      },
      connecting: () => {
        console.log('WebSocket connecting...');
      },
    },
    retryAttempts: 5,
    shouldRetry: () => true,
    lazy: true, // Set to true to avoid immediate connection
  }))
  : null;

const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
    ({ query }) => {
      const definition = getMainDefinition(query);
      return (
        definition.kind === 'OperationDefinition' &&
        definition.operation === 'subscription'
      );
    },
    wsLink,
    httpLink,
  )
  : httpLink;

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});