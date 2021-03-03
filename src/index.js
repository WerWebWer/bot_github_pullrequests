const github = require('@actions/github')
const core = require('@actions/core')
const fs = require('fs')
const { subDays } = require('date-fns')

function getReviewers() {
  const configPath = core.getInput('config', { required: true })

  return fs
    .readFileSync(configPath, 'utf8')
    .split('\n')
    .map(r => r.split(' '))
    .map(reviewer => ({
      username: reviewer[0],
      weight: reviewer[1] == undefined ? 0 : parseFloat(reviewer[1])
    }))
}

async function getReviewCount(octokit, user, dateFrom) {
  const { graphql } = octokit

  const contributionsQuery = await graphql({
    query: `
      query userContributions($user: String!, $dateFrom: DateTime!, $organizationId: ID!) {
        user(login: $user) {
          contributionsCollection(
            from: $dateFrom
            organizationID: $organizationId
          ) {
            pullRequestReviewContributionsByRepository {
              contributions {
                totalCount
              }
              repository {
                nameWithOwner
              }
            }
          }
        }
      }
    `,
    dateFrom,
    organizationId: github.context.payload.repository.owner.node_id,
    user
  })

  const repoFullName = github.context.payload.repository.full_name

  const reviewContributions = contributionsQuery.user.contributionsCollection.pullRequestReviewContributionsByRepository.find(
    ({ repository }) =>
      repository.nameWithOwner.toLowerCase() === repoFullName.toLowerCase()
  )
  const reviewCount = reviewContributions
    ? reviewContributions.contributions.totalCount
    : 0

  return reviewCount
}

// Return the reviewer with the lowest weighted count
function getNextReviewer(reviewers) {
  return reviewers.reduce((reviewer, nextReviewer) =>
    reviewer.weightedCount < nextReviewer.weightedCount
      ? reviewer
      : nextReviewer
  )
}

async function run() {
  try {
    const token = core.getInput('repo-token', { required: true })
    const octokit = github.getOctokit(token)

    console.log('Context:', JSON.stringify(github.context, null, 2))

    const prNumber = github.context.payload.number

    const assignedReviewers = await octokit.pulls.listRequestedReviewers({
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: prNumber
    })

    const reviews = await octokit.pulls.listReviews({
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: prNumber
    })

    console.log('Assigned Reviewers:', assignedReviewers.data)

    console.log('Reviews:', reviews.data)

    if (assignedReviewers.data.users.length > 0 || reviews.data.length > 0) {
      console.log(
        'Skipping because there is already at least one user assigned to this PR or it has already been reviewed'
      )
      return
    }

    const reviewers = getReviewers().filter(
      r => r.username !== github.context.payload.pull_request.user.login
    )

    const cutoffDate = subDays(new Date(), 7)

    for (const reviewer of reviewers) {
      const reviewCount = await getReviewCount(
        octokit,
        reviewer.username,
        cutoffDate
      )

      reviewer.count = reviewCount
      reviewer.weightedCount =
        reviewer.weight !== 0
          ? Math.floor(reviewCount / reviewer.weight)
          : Infinity
    }

    console.log('Reviewers:', reviewers)

    const nextReviewer = getNextReviewer(reviewers)

    const opts = {
      owner: github.context.payload.repository.owner.login,
      repo: github.context.payload.repository.name,
      pull_number: prNumber,
      reviewers: [nextReviewer.username]
    }

    console.log(`Assigning PR ${prNumber} to ${nextReviewer.username}`)
    console.log('(Payload):', opts)

    await octokit.pulls.requestReviewers(opts)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
