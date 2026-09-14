package github

import "time"

// Profile mirrors the fields we use from GET /users/{username}
type Profile struct {
	Login       string    `json:"login"`
	Name        string    `json:"name"`
	AvatarURL   string    `json:"avatar_url"`
	Bio         string    `json:"bio"`
	Company     string    `json:"company"`
	Blog        string    `json:"blog"`
	Location    string    `json:"location"`
	Email       string    `json:"email"`
	Followers   int       `json:"followers"`
	Following   int       `json:"following"`
	PublicRepos int       `json:"public_repos"`
	PublicGists int       `json:"public_gists"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
	HTMLURL     string    `json:"html_url"`
}

// Repo mirrors the fields we use from GET /users/{username}/repos
type Repo struct {
	Name            string    `json:"name"`
	FullName        string    `json:"full_name"`
	Description     string    `json:"description"`
	Fork            bool      `json:"fork"`
	Archived        bool      `json:"archived"`
	StargazersCount int       `json:"stargazers_count"`
	WatchersCount   int       `json:"watchers_count"`
	ForksCount      int       `json:"forks_count"`
	Size            int       `json:"size"` // KB
	Language        string    `json:"language"`
	Topics          []string  `json:"topics"`
	HasIssues       bool      `json:"has_issues"`
	OpenIssuesCount int       `json:"open_issues_count"`
	License         *License  `json:"license"`
	PushedAt        time.Time `json:"pushed_at"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	HasReadmeCache  *bool     `json:"-"` // populated separately, not from GitHub JSON
	HasReleaseCache *bool     `json:"-"`
}

type License struct {
	Key  string `json:"key"`
	Name string `json:"name"`
}

// Event mirrors GET /users/{username}/events/public (recent activity, last ~90 days)
type Event struct {
	Type      string    `json:"type"`
	CreatedAt time.Time `json:"created_at"`
	Repo      struct {
		Name string `json:"name"`
	} `json:"repo"`
	Payload struct {
		Commits []struct {
			Sha     string `json:"sha"`
			Message string `json:"message"`
		} `json:"commits"`
		Action string `json:"action"`
	} `json:"payload"`
}

// ContributionCalendar comes from the GraphQL contributionsCollection query.
type ContributionCalendar struct {
	TotalContributions int `json:"totalContributions"`
	Weeks               []struct {
		ContributionDays []struct {
			ContributionCount int    `json:"contributionCount"`
			Date              string `json:"date"`
		} `json:"contributionDays"`
	} `json:"weeks"`
}

type ContributionsCollection struct {
	TotalCommitContributions            int                  `json:"totalCommitContributions"`
	TotalIssueContributions             int                  `json:"totalIssueContributions"`
	TotalPullRequestContributions       int                  `json:"totalPullRequestContributions"`
	TotalPullRequestReviewContributions int                  `json:"totalPullRequestReviewContributions"`
	TotalRepositoriesWithContributedCommits int              `json:"totalRepositoriesWithContributedCommits"`
	ContributionCalendar                ContributionCalendar `json:"contributionCalendar"`
}

type graphQLUserData struct {
	User struct {
		ContributionsCollection ContributionsCollection `json:"contributionsCollection"`
	} `json:"user"`
}

type graphQLResponse struct {
	Data   graphQLUserData `json:"data"`
	Errors []struct {
		Message string `json:"message"`
	} `json:"errors"`
}

// Snapshot bundles everything fetched about a user, ready for the scoring engine.
type Snapshot struct {
	Profile       Profile
	Repos         []Repo
	Events        []Event
	Contributions ContributionsCollection
	FetchedAt     time.Time
}
