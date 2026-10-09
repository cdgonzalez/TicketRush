# 1. Use Pessimistic Locking with SKIP LOCKED for Ticket Reservation

Date: 2026-10-09

## Status
Accepted

## Context
Necesitamos prevenir la sobreventa (double-booking) de boletos cuando miles de usuarios intentan reservar asientos para un evento popular simultáneamente. Las opciones evaluadas fueron:
1. **Optimistic Locking (Version Column):** Requiere que la aplicación maneje colisiones pesadas mediante reintentos. Bajo estrés extremo, causará un alto número de transacciones fallidas y carga innecesaria en la aplicación.
2. **Redis Distributed Locks:** Introduce complejidad de red y riesgos si el lock expira antes de que la transacción de DB se complete.
3. **Pessimistic Locking (PostgreSQL):** Utilizar `SELECT ... FOR UPDATE`. Tradicionalmente causa cuellos de botella por esperas.

## Decision
Decidimos utilizar **Pessimistic Locking** en PostgreSQL, específicamente aprovechando la directiva `SKIP LOCKED`. 

## Consequences
- **Positivo:** Las transacciones concurrentes no esperan a que se liberen los bloqueos; simplemente toman el siguiente registro disponible. Esto maximiza el throughput de la base de datos.
- **Positivo:** Eliminamos el riesgo de *deadlocks* a nivel de aplicación.
- **Negativo:** Nos acopla a las capacidades específicas del motor de PostgreSQL, limitando la portabilidad a bases de datos que no soporten `SKIP LOCKED` (como motores SQL más antiguos), un *trade-off* aceptable dado el beneficio de rendimiento.