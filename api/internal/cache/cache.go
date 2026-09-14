// Package cache provides a minimal in-memory TTL cache.
//
// NOTE ON SERVERLESS: Vercel functions run in ephemeral, per-instance processes.
// This cache only helps for repeat requests hitting the SAME warm instance
// (common during a single user's session) — it is not shared across instances.
// If you need a durable, shared cache/leaderboard, swap this out for Vercel KV
// or Redis behind the same Get/Set interface.
package cache

import (
	"strings"
	"sync"
	"time"
)

type entry struct {
	value     interface{}
	expiresAt time.Time
}

type TTLCache struct {
	mu   sync.RWMutex
	data map[string]entry
	ttl  time.Duration
}

func New(ttl time.Duration) *TTLCache {
	return &TTLCache{
		data: make(map[string]entry),
		ttl:  ttl,
	}
}

func (c *TTLCache) Get(key string) (interface{}, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	e, ok := c.data[key]
	if !ok || time.Now().After(e.expiresAt) {
		return nil, false
	}
	return e.value, true
}

func (c *TTLCache) Set(key string, value interface{}) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.data[key] = entry{value: value, expiresAt: time.Now().Add(c.ttl)}
}

// Shared is a package-level cache instance reused across warm invocations of the same function.
var Shared = New(5 * time.Minute)

// PlayerKey builds the cache key for a player lookup, normalized to lowercase so
// "Torvalds" and "torvalds" share a cache entry.
func PlayerKey(username string) string {
	return "player:" + strings.ToLower(username)
}
