function toNumber(value) {
  return value == null ? null : Number(value);
}

function normalizeTopVotedProject(project) {
  if (!project) return null;

  return {
    ...project,
    votes: toNumber(project.votes),
  };
}

function mapGlobalStats(data) {
  return {
    totalUsers: toNumber(data.totalusers),
    totalComments: toNumber(data.totalcomments),
    totalProjects: toNumber(data.totalprojects),
    averageLifespan: toNumber(data.averagelifespan),
    mostCommonCause: data.mostcommoncause,
    funeralsToday: toNumber(data.funeralstoday),
    totalVotes: toNumber(data.totalvotes),
    votesToday: toNumber(data.votestoday),
    averageEulogyLength: toNumber(data.averageeulogylength),
    rageQuitRate: toNumber(data.ragequitrate),
    topBurialDay: data.topburialday,
    topBurialMonth: data.topburialmonth,
    mostVotedProject: normalizeTopVotedProject(data.topvotedproject),
  };
}

function mapUserStats(data) {
  return {
    totalComments: toNumber(data.totalcomments),
    totalProjects: toNumber(data.totalprojects),
    averageLifespan: toNumber(data.averagelifespan),
    mostCommonCause: data.mostcommoncause,
    funeralsToday: toNumber(data.funeralstoday),
    totalVotes: toNumber(data.totalvotes),
    votesToday: toNumber(data.votestoday),
    averageEulogyLength: toNumber(data.averageeulogylength),
    rageQuitRate: toNumber(data.ragequitrate),
    topBurialDay: data.topburialday,
    topBurialMonth: data.topburialmonth,
    mostVotedProject: normalizeTopVotedProject(data.topvotedproject),
  };
}

module.exports = { mapGlobalStats, mapUserStats };
