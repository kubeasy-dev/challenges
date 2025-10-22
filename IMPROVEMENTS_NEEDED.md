# Challenges Improvements Summary

## ✅ Completed

### 1. probes-drift - DONE
**Changed from:** Path typo (`/healthz` vs `/health`)
**Changed to:** Slow-starting app (15s) with too aggressive readiness probe
**Concepts taught:**
- Startup vs Readiness vs Liveness probes
- Probe timing parameters
- When to use each probe type

### 2. bad-config - DONE
**Changed from:** JSON syntax typos
**Changed to:** ConfigMap updated but pods not restarted
**Concepts taught:**
- ConfigMap update behavior
- Checksum annotation pattern for rolling updates
- Immutable ConfigMaps
- Rolling update triggers

---

## 🔧 To Do

### 3. out-of-space

**Current problem:** StorageClass name mismatch (`fast-ssd` vs `standard-ssd`)

**New problem:** `accessMode: ReadWriteOnce` with multiple replicas on different nodes

**Files to modify:**

#### `manifests/pvc.yaml`
```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-data
spec:
  accessModes:
    - ReadWriteOnce  # Problem: Can only be mounted by one node
  resources:
    requests:
      storage: 1Gi
  storageClassName: rancher.io/local-path  # Kind's default storage class
```

#### `manifests/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: StatefulSet  # Changed from Deployment
metadata:
  name: postgres
spec:
  serviceName: postgres
  replicas: 1  # Start with 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
        - name: postgres
          image: postgres:15-alpine
          ports:
            - containerPort: 5432
          env:
            - name: POSTGRES_PASSWORD
              value: "password"
            - name: PGDATA
              value: /var/lib/postgresql/data/pgdata
          volumeMounts:
            - name: postgres-data
              mountPath: /var/lib/postgresql/data
  volumeClaimTemplates:
    - metadata:
        name: postgres-data
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
        storageClassName: rancher.io/local-path
```

**Problem scenario:**
- User tries to scale to `replicas: 3`
- 2 pods stuck in Pending: "Multi-Attach error for volume"
- Volume is RWO and already mounted on another node

**Solution:**
1. Understand why RWO doesn't work with multi-pod on different nodes
2. Either:
   - Keep replicas=1 (correct for RWO + StatefulSet)
   - OR use ReadWriteMany (requires NFS/CephFS, not available in Kind)
   - OR use ReadWriteOncePod (Kubernetes 1.29+, CSI driver specific)

**Concepts taught:**
- AccessModes: ReadWriteOnce vs ReadWriteMany vs ReadWriteOncePod
- Impact on pod scheduling across nodes
- When to use StatefulSet vs Deployment
- Volume binding modes
- Local storage limitations in Kind

#### `challenge.yaml`
```yaml
title: Out of Space
description: |
  The database was running fine with one replica. After scaling to 3 replicas,
  two pods are stuck in Pending with volume mount errors.
theme: volumes-secrets
difficulty: intermediate
estimated_time: 20
initial_situation: |
  A PostgreSQL StatefulSet was deployed with a PersistentVolumeClaim.
  It was running fine with 1 replica. The ops team scaled it to 3 replicas for high availability.
  Now 2 pods are stuck in Pending with "Multi-Attach error" messages.
  The PVC shows as Bound, but the pods can't mount it.
objective: |
  Understand why multiple pods can't mount the same volume and fix the configuration.
  The solution should allow the database to run properly (hint: not all databases need 3 replicas).
```

#### `static/pvc-validation.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: check-statefulset
data:
  check-replicas-vs-access-mode.rego: |
    package kubeasy.challenge

    violation[{"msg": msg}] {
      input.kind == "StatefulSet"
      input.spec.replicas > 1
      # Check if using ReadWriteOnce with multiple replicas
      msg := "StatefulSet with replicas > 1 requires ReadWriteMany or individual PVCs per pod (volumeClaimTemplates)"
    }
```

---

### 4. traffic-jam

**Current problem:** Service selector mismatch

**New problem:** Service configured correctly but no Endpoints because readiness probe fails

**Files to modify:**

#### `manifests/deployment.yaml`
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-service
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-service
  template:
    metadata:
      labels:
        app: api-service
    spec:
      containers:
        - name: api
          image: nginx:alpine
          ports:
            - containerPort: 80
          readinessProbe:
            httpGet:
              path: /healthz  # Wrong! nginx doesn't have /healthz
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 10
            periodSeconds: 10
```

#### `manifests/service.yaml`
```yaml
apiVersion: v1
kind: Service
metadata:
  name: api-service
spec:
  selector:
    app: api-service  # Correct selector!
  ports:
    - port: 80
      targetPort: 80
  type: ClusterIP
```

#### `manifests/ingress.yaml`
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: api-ingress
spec:
  rules:
    - host: api.local
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: api-service
                port:
                  number: 80
```

**Problem scenario:**
1. Service selector matches pod labels ✅
2. Pods are running ✅
3. But readiness probe fails because `/healthz` doesn't exist
4. Service has NO endpoints
5. Ingress returns 503 "Service Unavailable"

**Solution:**
Fix readiness probe path from `/healthz` to `/` (nginx root)

**Debugging steps:**
```bash
kubectl get endpoints api-service
# Shows: No endpoints (because readiness fails)

kubectl describe pod <pod-name>
# Shows: Readiness probe failed: HTTP 404

kubectl get svc api-service -o yaml
# Selector is correct

kubectl logs <pod-name>
# Shows nginx is running

# Fix: Change readiness probe path to /
```

**Concepts taught:**
- Service → Endpoints relationship
- Impact of readiness probes on Service endpoints
- Why Ingress returns 503 when no endpoints
- Debugging Service connectivity issues
- Kind Ingress specifics (uses nginx ingress controller)

#### `challenge.yaml`
```yaml
title: Traffic Jam
description: |
  The API service is deployed and running, but external requests through Ingress return 503.
  Internal curl to pods works fine, but the Ingress can't route traffic.
theme: networking
difficulty: advanced
estimated_time: 20
initial_situation: |
  A microservice was deployed with a Service and Ingress configured.
  The pods are Running and responding to direct curl requests.
  However, external traffic through the Ingress returns 503 Service Unavailable.
  The Service selector matches the pod labels, and the Ingress configuration looks correct.
objective: |
  Debug why the Ingress can't route traffic to the Service.
  External requests through the Ingress should reach the pods successfully.
```

#### `static/service-validation.yaml`
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: check-deployment-probes
data:
  readiness-probe-path.rego: |
    package kubeasy.challenge

    violation[{"msg": msg}] {
      container := input.spec.template.spec.containers[_]
      container.readinessProbe
      container.readinessProbe.httpGet
      container.readinessProbe.httpGet.path == "/healthz"
      msg := "Readiness probe path /healthz doesn't exist for nginx - this will prevent Service endpoints"
    }
```

#### `dynamic/check-endpoints.yaml`
```yaml
apiVersion: challenge.kubeasy.dev/v1alpha1
kind: DynamicValidation
metadata:
  name: check-service-endpoints
spec:
  target:
    apiVersion: v1
    kind: Service
    name: api-service
  checks:
    - kind: endpoints
      endpointsCheck:
        minReady: 1  # At least 1 endpoint must be Ready
```

**Note:** The `endpointsCheck` might need to be added to the operator if it doesn't exist yet.

---

## Summary

| Challenge | Status | Concepts Taught |
|-----------|--------|-----------------|
| probes-drift | ✅ Done | Startup/Readiness/Liveness probes, timing |
| bad-config | ✅ Done | ConfigMap updates, checksums, rolling updates |
| out-of-space | 📝 To do | AccessModes, StatefulSet, volume constraints |
| traffic-jam | 📝 To do | Service/Endpoints, readiness impact, Ingress debugging |

All challenges now teach real Kubernetes concepts instead of just finding typos!
