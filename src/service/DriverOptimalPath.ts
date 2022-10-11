export interface LatLong {
  sourceId: number;
  lat: number;
  long: number;
}

export class DriverOptimalPath {
  private static instance: DriverOptimalPath;
  constructor() {
    if (DriverOptimalPath.instance instanceof DriverOptimalPath) {
      return DriverOptimalPath.instance;
    }
    DriverOptimalPath.instance = this;
  }

  public execute(latLong: LatLong[]): number[] {
    const sourceDestiMatrix = [];
    for (let i = 0; i < latLong.length; i++) {
      const dist: number[] = [];
      for (let j = 0; j < latLong.length; j++) {
        dist[j] = this.getDistanceFromLatLonInKm(
          latLong[i].lat,
          latLong[i].long,
          latLong[j].lat,
          latLong[j].long,
        );
      }
      sourceDestiMatrix[i] = dist;
    }
    const minCostPath: number[] = new MincostPath(0, sourceDestiMatrix).getTour();
    minCostPath.pop();
    minCostPath.shift();
    return minCostPath;
  }

  private getDistanceFromLatLonInKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1); // deg2rad below
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI / 180);
  }
}

class MincostPath {
  private N: number;
  private start: number;
  private distance: number[][];
  private tour: number[] = [];
  private minTourCost = Number.MAX_VALUE;
  private ranSolver = false;

  constructor(start: number, distance: number[][]) {
    this.N = distance.length;
    this.start = start;
    this.distance = distance;
  }

  // Returns the optimal tour for the traveling salesman problem.
  public getTour(): number[] {
    if (!this.ranSolver) this.solve();
    return this.tour;
  }

  // Returns the minimal tour cost.
  public getTourCost(): number {
    if (!this.ranSolver) this.solve();
    return this.minTourCost;
  }

  // Solves the traveling salesman problem and caches solution.
  public solve(): void {
    if (this.ranSolver) return;

    const END_STATE = (1 << this.N) - 1;
    const memo: number[][] = [];
    for (let i = 0; i < this.N; i++) {
      const ans = [];
      for (let j = 0; j < 1 << this.N; j++) {
        ans[j] = 0;
      }
      memo[i] = ans;
    }

    // Add all outgoing edges from the starting node to memo table.
    for (let end = 0; end < this.N; end++) {
      if (end === this.start) continue;
      memo[end][(1 << this.start) | (1 << end)] = this.distance[this.start][end];
    }

    for (let r = 3; r <= this.N; r++) {
      for (const subset of this.combinations1(r, this.N)) {
        if (this.notIn(this.start, subset)) continue;
        for (let next = 0; next < this.N; next++) {
          if (next === this.start || this.notIn(next, subset)) continue;
          const subsetWithoutNext = subset ^ (1 << next);
          let minDist = Number.MAX_VALUE;
          for (let end = 0; end < this.N; end++) {
            if (end === this.start || end === next || this.notIn(end, subset)) continue;
            const newDistance = memo[end][subsetWithoutNext] + this.distance[end][next];
            if (newDistance < minDist) {
              minDist = newDistance;
            }
          }
          memo[next][subset] = minDist;
        }
      }
    }

    // Connect tour back to starting node and minimize cost.
    for (let i = 0; i < this.N; i++) {
      if (i === this.start) continue;
      const tourCost = memo[i][END_STATE] + this.distance[i][this.start];
      if (tourCost < this.minTourCost) {
        this.minTourCost = tourCost;
      }
    }

    let lastIndex = this.start;
    let state = END_STATE;
    this.tour.push(this.start);

    // Reconstruct TSP path from memo table.
    for (let i = 1; i < this.N; i++) {
      let index = -1;
      for (let j = 0; j < this.N; j++) {
        if (j === this.start || this.notIn(j, state)) continue;
        if (index === -1) index = j;
        const prevDist = memo[index][state] + this.distance[index][lastIndex];
        const newDist = memo[j][state] + this.distance[j][lastIndex];
        if (newDist < prevDist) {
          index = j;
        }
      }

      this.tour.push(index);
      state = state ^ (1 << index);
      lastIndex = index;
    }

    this.tour.push(this.start);
    this.tour.reverse();
    this.ranSolver = true;
  }

  private notIn(elem: number, subset: number) {
    return ((1 << elem) & subset) === 0;
  }

  // This method generates all bit sets of size n where r bits
  // are set to one. The result is returned as a list of integer masks.
  public combinations1(r: number, n: number): number[] {
    const subsets: number[] = [];
    this.combinations2(0, 0, r, n, subsets);
    return subsets;
  }

  // To find all the combinations of size r we need to recurse until we have
  // selected r elements (aka r = 0), otherwise if r != 0 then we still need to select
  // an element which is found after the position of our last selected element
  private combinations2(set: number, at: number, r: number, n: number, subsets: number[]): void {
    // Return early if there are more elements left to select than what is available.
    const elementsLeftToPick = n - at;
    if (elementsLeftToPick < r) return;

    // We selected 'r' elements so we found a valid subset!
    if (r === 0) {
      subsets.push(set);
    } else {
      for (let i = at; i < n; i++) {
        // Try including this element
        set |= 1 << i;

        this.combinations2(set, i + 1, r - 1, n, subsets);

        // Backtrack and try the instance where we did not include this element
        set &= ~(1 << i);
      }
    }
  }
}
