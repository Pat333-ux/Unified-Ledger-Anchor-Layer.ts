// Unified-Ledger-Anchor-Layer.ts
// Deterministic ledger anchoring layer for Beast System 3.0.
// Produces immutable transition packets and anchors them to the sovereign ledger.

import {
  EngineDeclaration,
  PhaseId,
  UnifiedSystemRegistry
} from "./Unified-System-Registry-Core";

export interface LedgerAnchorPacket {
  id: string;
  engineId: string;
  phase: PhaseId;
  timestamp: number;
  identityContext: string;
  governanceContext: string;
  payload: Record<string, any>;
  hash: string;
}

export interface LedgerAnchorResult {
  packet: LedgerAnchorPacket;
  anchored: boolean;
}

export class LedgerAnchorLayer {
  constructor(
    private readonly registry: UnifiedSystemRegistry,
    private readonly ledger: Map<string, LedgerAnchorPacket> = new Map()
  ) {}

  createPacket(
    engine: EngineDeclaration,
    phase: PhaseId,
    payload: Record<string, any>,
    identityContext: string,
    governanceContext: string
  ): LedgerAnchorPacket {
    const timestamp = Date.now();
    const id = `${engine.id}:${timestamp}`;
    const hash = this.computeHash(id, engine.id, phase, timestamp, payload);

    return {
      id,
      engineId: engine.id,
      phase,
      timestamp,
      identityContext,
      governanceContext,
      payload,
      hash
    };
  }

  anchor(packet: LedgerAnchorPacket): LedgerAnchorResult {
    if (this.ledger.has(packet.id)) {
      throw new Error(`Ledger violation: packet already anchored: ${packet.id}`);
    }

    this.ledger.set(packet.id, packet);

    return {
      packet,
      anchored: true
    };
  }

  computeHash(
    id: string,
    engineId: string,
    phase: PhaseId,
    timestamp: number,
    payload: Record<string, any>
  ): string {
    const raw = JSON.stringify({ id, engineId, phase, timestamp, payload });
    let hash = 0;

    for (let i = 0; i < raw.length; i++) {
      const chr = raw.charCodeAt(i);
      hash = (hash << 5) - hash + chr;
      hash |= 0;
    }

    return `HASH_${Math.abs(hash)}`;
  }

  listAnchored(): ReadonlyArray<LedgerAnchorPacket> {
    return Array.from(this.ledger.values());
  }
}

// Example usage
export function createLedgerAnchorLayer(reg: UnifiedSystemRegistry) {
  return new LedgerAnchorLayer(reg);
}
