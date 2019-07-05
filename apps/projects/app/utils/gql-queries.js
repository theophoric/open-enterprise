import { gql } from 'apollo-boost'

export const getIssuesGQL = repos => {
  const queries = Object.keys(repos).map((repoId, i) => `
    node${i}: node(id: "${repoId}") {
      id
      ... on Repository {
        issues(
          states:OPEN,
          first: ${repos[repoId].fetch},
          ${repos[repoId].showMore ? `after: "${repos[repoId].endCursor}",` : ''}
         orderBy: {field: CREATED_AT, direction: DESC}
        ) {
          totalCount
          pageInfo {
            endCursor
            hasNextPage
          }
          nodes {
            number
            id
            title
            body
            createdAt
            repository {
              id
              name
            }
            labels(first: 50) {
              totalCount
              edges {
                node {
                  id
                  name
                  color
                }
              }
            }
            milestone {
              id
              title
            }
            state
            url
          }
        }
      }
    }`
  )
  return gql`query getIssuesForRepos {
    ${queries.join('')}
  }`
}

export const NEW_ISSUE = gql`
  mutation create($title: String!, $description: String, $id: ID!) {
    createIssue(
      input: { title: $title, body: $description, repositoryId: $id }
    ) {
      issue {
        id
      }
    }
  }
`
export const CURRENT_USER = gql`
  query {
    viewer {
      id
      login
      url
      avatarUrl
    }
  }
`
export const GET_REPOSITORIES = gql`
  query {
    viewer {
      id
     repositories(
       first: 100,
       orderBy: {field: UPDATED_AT, direction: DESC}
       ownerAffiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER],
       affiliations: [OWNER, COLLABORATOR, ORGANIZATION_MEMBER]) {
       totalCount
       edges {
        node {
          nameWithOwner
          id
          owner {
            id
          }
        }
      }
     }
   }
 }
`
export const COMMENT = gql`
  mutation comment($body: String!, $subjectId: ID!) {
    addComment(
      input: { body: $body, subjectId: $subjectId }
    ) {
      subject {
        id
      }
    }
  }
`
