export interface TimeSyncPort {
  enqueueApprovedHours(visitId: string): Promise<void>;
}

export class StubTimeSync implements TimeSyncPort {
  async enqueueApprovedHours(visitId: string): Promise<void> {
    // MVP stub — Ordrestyring sync later
    console.log(`[TimeSyncStub] enqueueApprovedHours visit=${visitId}`);
  }
}
