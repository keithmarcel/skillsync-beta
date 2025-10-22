export const routes = {
  home: '/',
  jobs: '/jobs',
  job: (id: string) => `/jobs/${id}`,
  programs: '/programs',
  program: (id: string) => `/programs/${id}`,
  assessment: (id: string) => `/assessments/${id}`,
  quizAssessment: (jobId: string) => `/assessments/quiz/${jobId}`,
  programMatches: (assessmentId: string) => `/program-matches/${assessmentId}`,
  myAssessments: '/my-assessments',
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    callback: '/auth/callback'
  }
}

export const getJobUrl = (id: string) => routes.job(id)
export const getProgramUrl = (id: string) => routes.program(id)
export const getAssessmentUrl = (id: string) => routes.assessment(id)
export const getProgramMatchesUrl = (assessmentId: string) => routes.programMatches(assessmentId)
