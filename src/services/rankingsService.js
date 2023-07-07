export function getRankings() {
  let rankings = [
    {
      name: "Benton",
      rating: 1093,
    },
    {
      name: "Peter",
      rating: 1066,
    },
    {
      name: "Alex",
      rating: 932,
    },
    {
      name: "Rob",
      rating: 967,
    },
    {
      name: "Lane",
      rating: 951,
    },
    {
      name: "Jimmy",
      rating: 1016,
    },
    {
      name: "Samir",
      rating: 983,
    },
    {
      name: "Greg",
      rating: 1021,
    }
  ]
  
  return rankings.sort((p1, p2) => (p1.rating < p2.rating) ? 1 : (p1.rating > p2.rating) ? -1 : 0)
}