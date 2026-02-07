# [Epic] P2P Sync Handshake Protocol - Issue #4

**Label:** epic, size:M, priority:medium, category:network, security:high  
**Type:** Feature Request  
**Story Points:** 13  

## Title
Implement end-to-end encrypted P2P sync using WebRTC + TURN relay fallback

## Problem Statement
Users need to sync their encrypted workspace between their devices (laptop, phone, desktop) without relying on centralized cloud services. The system must maintain complete privacy through end-to-end encryption while providing seamless offline support and automatic discovery.

## Success Criteria
- [ ] Zero-configuration device discovery and pairing
- [ ] End-to-end encrypted data sync using WebRTC data channels
- [ ] Automatic TURN relay fallback for NAT/firewall traversal
- [ ] Conflict resolution using vector clocks and CRDTs
- [ ] Offline-first design with eventual consistency
- [ ] Sub-200ms sync latency over LAN
- [ ] Battery-optimized mobile support with reduced polling

## Technical Architecture

### Protocol Stack Design
```
┌─────────────────────┐     ┌─────────────────────┐
│   Workspace Node A   │     │   Workspace Node B   │
├─────────────────────┤     ├─────────────────────┤
│   Sync Protocol     │────▶│   Sync Protocol     │
│   (Merge Logic)     │◀────│   (Merge Logic)     │
├─────────────────────┤     ├─────────────────────┤
│   E2E Encryption    │     │   E2E Encryption    │
│   (AES-GCM + ECDH)  │     │   (AES-GCM + ECDH)  │
├─────────────────────┤     ├─────────────────────┤
│   WebRTC Data       │     │   WebRTC Data       │
│   Channels (CHM)    │     │   Channels (CHM)    │
├─────────────────────┤     │                     │
│   STUN Discovery    │     │   TURN Relay        │
│   (NAT Traversal)   │───┐ │   (Fallback)        │
│                     │   │ │                     │
└─────────────────────┘   │ └─────────────────────┘
          │               │           │
          └───────────────┴───────────┘
```

### Core Components

#### 1. Peer Discovery & Identity
- [ ] **Device Fingerprinting**: Unique cryptographic identity per device
- [ ] **mDNS Discovery**: Auto-discovery on the same network
- [ ] **QR Code Pairing**: Manual pairing for initial setup
- [ ] **Identity Verification**: ECDSA public key verification
- [ ] **Device Trust Store**: Secure storage of trusted device keys

#### 2. WebRTC Handshake Protocol
```typescript
interface SyncHandshake {
    version: string;                    // Protocol version
    deviceId: string;                   // Unique ED25519 public key
    workspaceId: string;                // Shared workspace identifier
    timestamp: number;                  // Unix timestamp for freshness
    nonce: Uint8Array;                  // 32-byte random nonce
    capability: SyncCapability;        // Supported features
    signature: Uint8Array;             // ECDSA signature over all fields
}

interface SyncCapability {
    supportsCRDT: boolean;
    maxFileSize: number;
    supportedFormats: string[];
    bandwidthOptimization: boolean;
}
```

#### 3. TURN Relay Integration
- [ ] **Relay Server Deployment**: Global TURN server mesh
- [ ] **Automatic Fallback**: Seamless transition to relay servers
- [ ] **Relay Cost Estimation**: Usage tracking and optimization
- [ ] **Relay Security**: Encrypted relay without trusted third party
- [ ] **Performance Optimization**: Smart relay server selection

### Data Sync Protocol

#### 4. Conflict Resolution Strategy
- [ ] **Last-Writer-Wins**: Simple timestamp-based resolution
- [ ] **Vector Clocks**: Ordering of concurrent writes
- [ ] **CRDT Integration**: Eventually consistent data structures
- [ ] **Merge Strategies**: Configurable per-file-type merging
- [ ] **Conflict UI**: Manual resolution assistance

#### 5. File Sync Mechanics
```python
class SyncProtocol:
    def establish_connection(self, peer: PeerIdentity):
        # ECDH key exchange for session keys
        shared_key = perform_ecdh_key_exchange(
            local_private_key, peer_public_key
        )
        return EncryptedChannel(shared_key)
    
    def sync_file_changes(self, changes: FileChanges):
        # Chunk-based file transmission
        encrypted_chunks = encrypt_file_changes(
            changes, session_key
        )
        send_chunks_over_datachannel(encrypted_chunks)
    
    def resolve_conflicts(self, local, remote):
        # Vector clock comparison
        if local.vector_clock.happens_before(remote.vector_clock):
            return remote
        elif remote.happens_before(local):
            return local
        else:
            return crdt_merge(local, remote)
```

### Implementation Details

#### WebRTC Data Channel Setup
```python
class WebSync:
    def create_data_channel(self, peer_id: str) -> DataChannel:
        configuration = RTCConfiguration([
            RTCIceServer('stun:stun.openclaw.ai:3478'),
            RTCIceServer('turn:turn.openclaw.ai:3478', username, credential)
        ])
        
        pc = RTCPeerConnection(configuration)
        dc = pc.createDataChannel('sync', negotiated=True, id=0)
        
        return SecureDataChannel(dc, encryption_key)
```

#### Sync Workflow
1. **Discovery Phase**: mDNS/QR code device detection
2. **Handshake Phase**: Identity verification + capability exchange
3. **Sync Phase**: Incremental file synchronization
4. **Conflict Resolution**: Apply winner or merge strategy
5. **Cleanup Phase**: Verify sync completion + disconnect

### Database Schema
```sql
CREATE TABLE sync_devices (
    device_id TEXT PRIMARY KEY,
    public_key BLOB NOT NULL,
    device_name TEXT NOT NULL,
    last_seen TIMESTAMP,
    trusted BOOLEAN DEFAULT false,
    connection_type TEXT CHECK (connection_type IN ('direct', 'relay'))
);

CREATE TABLE sync_sessions (
    session_id TEXT PRIMARY KEY,
    peer_device_id TEXT REFERENCES sync_devices(device_id),
    direction TEXT CHECK (direction IN ('inbound', 'outbound')),
    bytes_sent BIGINT DEFAULT 0,
    bytes_received BIGINT DEFAULT 0,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE file_versions (
    file_path TEXT NOT NULL,
    version_vector TEXT NOT NULL,  -- vector clock as JSON
    device_id TEXT REFERENCES sync_devices(device_id),
    checksum BLOB,
    last_modified TIMESTAMP,
    PRIMARY KEY (file_path, device_id, last_modified)
);
CREATE TABLE file_sync_state (
    file_path TEXT PRIMARY KEY,
    last_sync_version TEXT,
    last_sync_device TEXT,
    sync_status TEXT CHECK (sync_status IN ('in_sync', 'conflict', 'pending')),
    conflict_resolution TEXT  -- JSON describing merge strategy
);
```

## Security Model

### End-to-End Encryption
- [ ] **Ephemeral Keys**: Fresh ECDH key exchange per session
- [ ] **Perfect Forward Secrecy**: Compromise doesn't affect past sessions
- [ ] **Message Authentication**: Additional HMAC-AES-256 for integrity
- [ ] **Data Channel Security**: Encrypted within WebRTC's crypto layer
- [ ] **Key Rotation**: Periodic renegotiation for long-lived connections

### Privacy Features
- [ ] **Minimal Metadata**: Only send required sync data
- [ ] **Connection Obfuscation**: Prevent traffic analysis
- [ ] **Relay Privacy**: Zero-knowledge relay without data access
- [ ] **Device Anonymity**: No persistent identifying information

## Performance Optimization

### Bandwidth Optimization
- [ ] **Delta Sync**: Only sync changed file portions
- [ ] **Compression**: LZ4/snappy for file chunks
- [ ] **Chunking**: 64KB-512KB optimal chunk sizes
- [ ] **Bandwidth Throttling**: Adaptive based on connection type
- [ ] **Upload Rate Limiting**: Respect mobile data limits

### Mobile Optimization
- [ ] **Battery-Friendly**: 30-second polling intervals when idle
- [ ] **Background Sync**: Use mobile OS background sync APIs
- [ ] **Data Usage**: Mobile data detection and WiFi preference
- [ ] **Power Saving**: Reduce active connection time
- [ ] **Resume Support**: Resume interrupted sync sessions

## Mobile-Specific Features
- [ ] **QR Code Pairing**: Camera-based device setup
- [ ] **Background App Refresh**: iOS/Android integration
- [ ] **Cellular Data**: Configurable cellular sync limits
- [ ] **Low Power Mode**: Reduced sync frequency
- [ ] **Cross-Platform**: Desktop-mobile sync compatibility

## Deployment Architecture

### TURN Server Mesh
```yaml
turn_servers:
  global:
    - region: us-east-1
      hostname: turn-us-east.openclaw.ai
      port: 3478
      tls_port: 5349
    - region: eu-west-1
      hostname: turn-eu-west.openclaw.ai
      port: 3478
      tls_port: 5349
    - region: asia-pacific
      hostname: turn-ap-southeast.openclaw.ai
      port: 3478
      tls_port: 5349
      
  metrics:
    connection_duration: histogram
    bytes_transferred: counter
    geographic_distribution: map
```

### Health Monitoring
- [ ] **Relay Uptime**: Monitor TURN server availability
- [ ] **Connection Quality**: Track RTT, packet loss, jitter
- [ ] **Device Sync Success Rate**: Measure successful sync percentage
- [ ] **Bandwidth Utilization**: Optimize data usage patterns
- [ ] **Battery Impact**: Monitor power consumption on mobile

## Testing Strategy
- [ ] **Network Simulation**: Various NAT configurations
- [ ] **Conflict Testing**: Automated conflict scenario testing
- [ ] **Encryption Validation**: End-to-end encryption verification
- [ ] **Performance Benchmarks**: Sync speed and bandwidth usage
- [ ] **Mobile Testing**: Battery life and background sync
- [ ] **Cross-Platform**: Windows, macOS, Linux, iOS, Android

## Error Handling & Recovery

### Connection Failures
- [ ] **Retry Logic**: Exponential backoff with jitter
- [ ] **Network Change**: Auto-detection and reconnect
- [ ] **Partial Sync**: Resume interrupted sessions
- [ ] **Error Logging**: Detailed debug information
- [ ] **Fallback Systems**: Manual sync options

### Sync Conflicts
- [ ] **Automated Merging**: CRDT-based file merging
- [ ] **Manual Resolution**: User-friendly conflict UI
- [ ] **Backup Creation**: Original file preservation
- [ ] **Rollback Capability**: Undo sync operations
- [ ] **Notification System**: Conflict resolution alerts

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- WebRTC data channel setup
- Basic device discovery (mDNS)
- Initial handshake protocol
- Identity verification

### Phase 2: Sync Logic (Week 3-4)
- File change detection
- Delta encoding implementation
- Basic conflict resolution
- Session management

### Phase 3: Reliability (Week 5-6)
- TURN relay integration
- Error handling and recovery
- Performance optimization
- Mobile support

### Phase 4: Polish (Week 7+)
- Advanced conflict resolution (CRDTs)
- Cross-platform testing
- Performance benchmarking
- Production deployment

## Performance Targets
- **Connection Establishment**: <2 seconds over LAN
- **File Sync Speed**: 10+ MB/s over WiFi
- **Relay Usage**: <5% of total connections
- **Mobile Battery**: <5% additional drain
- **Conflict Resolution**: <100ms per conflict

---
## PR Template - P2P Sync Protocol

```markdown
## 🌐 Network Impact
- **Protocol Compatibility**: ✅/⚠️ (WebRTC version compatibility)
- **TURN Server**: 🔁 (relay fallback tested)
- **NAT Traversal**: 🔄 (various NAT configurations tested)
- **Security Review**: 🔒 (encryption verification completed)

## ✅ Verification Checklist
- [ ] WebRTC connection established successfully
- [ ] End-to-end encryption verified (no plaintext data)
- [ ] TURN relay fallback tested on restricted networks
- [ ] Conflict resolution handles all test scenarios
- [ ] Mobile sync tested on iOS and Android
- [ ] Performance benchmarks meet targets
- [ ] Security audit completed
- [ ] Cross-platform compatibility verified
- [ ] Documentation updated (protocol specs)

## 🔍 Testing Requirements
- [ ] **Network Tests**: LAN, WiFi, cellular, VPN
- [ ] **Conflict Tests**: File addition, modification, deletion
- [ ] **Encryption Tests**: Key exchange, authentication
- [ ] **Mobile Tests**: Battery life, background sync
- [ ] **Security Tests**: MITM prevention, replay attacks
- [ ] **Stress Tests**: High concurrent sync operations

## 📊 Metrics to Verify
- [ ] Sync success rate >99%
- [ ] Average connection time <2s
- [ ] Conflict resolution accuracy >95%
- [ ] Mobile battery impact <5%
- [ ] Relay usage <5% of connections

## 🚀 Merge Strategy
⚡ **Squash merge to main** with clear protocol version in commit message
```

---
**Estimated Time:** 8 weeks  
**Assignee:** TBD  
**Milestone:** P2P Sync Phase