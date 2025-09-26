import nodeNetstat from "node-netstat";
import { Observable, interval, mergeMap, switchMap } from "rxjs";
import { Logger } from "./log";

export type PortAttributes = {
  port: number;
  pid?: number;
  commandLine?: string;
};

export const netstat = (
  ports: number[],
  intervalMs?: number
): Observable<PortAttributes> => {
  const logger = new Logger("netstat");
  const seenPorts = new Set<number>();

  // one-shot scan observable
  const scan$ = new Observable<PortAttributes[]>((subscriber) => {
    const observed: PortAttributes[] = [];

    const netstat = nodeNetstat(
      {
        sync: false,
        watch: false,
        done: (error) => {
          if (error) logger.log("error", "Netstat Error", { error });
          subscriber.next(observed);
          subscriber.complete();
        },
      },
      (data) => {
        const { local, pid, state } = data;
        if (state !== "LISTEN") return;
        if (!local.port) return;
        if (!ports.includes(local.port)) return;

        observed.push({
          port: local.port,
          pid,
        });
      }
    ) as nodeNetstat.AsyncResult;

    return () => {
      netstat.cancel();
    };
  });

  // poll every intervalMs and emit only new ports
  return interval(intervalMs).pipe(
    switchMap(() => scan$),
    mergeMap((ports) => {
      const currentPorts = new Set(ports.map((p) => p.port));

      // Remove ports that are no longer listening
      for (const seenPort of seenPorts) {
        if (!currentPorts.has(seenPort)) {
          seenPorts.delete(seenPort);
        }
      }

      // Filter and add new ports
      return ports.filter((port) => {
        if (seenPorts.has(port.port)) {
          return false;
        }
        seenPorts.add(port.port);
        return true;
      });
    })
  );
};
