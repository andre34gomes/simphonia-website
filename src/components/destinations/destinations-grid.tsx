"use client";

import { useMemo, useState } from "react";
import { Search, SearchX } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Badge } from "@/components/ui/badge";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { destinations, continents, type Continent } from "@/data/destinations";
import { CountryFlag } from "@/components/destinations/country-flag";

type ContinentFilter = "All" | Continent;

const filters: ContinentFilter[] = ["All", ...continents];

export function DestinationsGrid() {
  const [query, setQuery] = useState("");
  const [activeContinent, setActiveContinent] = useState<ContinentFilter>("All");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return destinations.filter((destination) => {
      const matchesContinent =
        activeContinent === "All" || destination.continent === activeContinent;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        destination.name.toLowerCase().includes(normalizedQuery);
      return matchesContinent && matchesQuery;
    });
  }, [query, activeContinent]);

  return (
    <section id="destinations-grid" className="mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-24">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Where Will You Go Next?
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Coverage across 200+ countries and regions. Search or filter to
          find your destination.
        </p>
      </div>

      <div className="mt-10 flex flex-col items-center gap-5">
        <InputGroup className="h-11 max-w-md">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Search destinations…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search destinations"
          />
        </InputGroup>

        <ToggleGroup
          value={[activeContinent]}
          onValueChange={(value) =>
            setActiveContinent((value[0] as ContinentFilter) ?? "All")
          }
          className="flex-wrap justify-center gap-2"
          aria-label="Filter destinations by continent"
        >
          {filters.map((filter) => (
            <ToggleGroupItem
              key={filter}
              value={filter}
              variant="outline"
              className="rounded-full px-4 data-[pressed]:border-primary/40 data-[pressed]:bg-primary/10 data-[pressed]:text-primary"
            >
              {filter}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground" aria-live="polite">
        Showing {filtered.length} of {destinations.length} featured destinations
      </p>

      {filtered.length > 0 ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filtered.map((destination) => (
            <div
              key={destination.code}
              className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-4 py-3 transition-colors hover:border-primary/40"
            >
              <CountryFlag
                code={destination.code}
                name={destination.name}
                className="h-5 w-7 shrink-0 rounded-[3px] object-cover"
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-foreground">
                  {destination.name}
                </span>
                {activeContinent === "All" ? (
                  <span className="block text-xs text-muted-foreground">
                    {destination.continent}
                  </span>
                ) : null}
              </span>
              {destination.popular ? (
                <Badge variant="secondary" className="shrink-0">
                  Popular
                </Badge>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <Empty className="mt-6 border border-dashed border-border/60">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SearchX />
            </EmptyMedia>
            <EmptyTitle>No destinations found</EmptyTitle>
            <EmptyDescription>
              Try a different search term or clear the continent filter.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </section>
  );
}
