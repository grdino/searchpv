"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  Bot,
  Search,
} from "lucide-react";

import Header from "@/app/components/Header";
import type {
  AskSearchPVResponse,
  AskSearchPVResponseBlock,
} from "@/lib/ask-searchpv/types";

type AskSearchPVApiPayload = {
  response: AskSearchPVResponse;
};

type AskSearchPVApiError = {
  requestId?: string;
  error?: {
    code?: string;
    message?: string;
  };
};

export default function AskSearchPVClient({
  initialQuestion,
}: {
  initialQuestion: string;
}) {
  const [question, setQuestion] =
    useState(initialQuestion);

  const [submittedQuestion, setSubmittedQuestion] =
    useState(initialQuestion);

  const [response, setResponse] =
    useState<AskSearchPVResponse | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  useEffect(() => {
    if (!initialQuestion) {
      return;
    }

    void askSearchPV(initialQuestion);
  }, [initialQuestion]);

  async function askSearchPV(
    nextQuestion: string,
  ) {
    const normalizedQuestion =
      nextQuestion.trim();

    if (!normalizedQuestion) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setResponse(null);
    setSubmittedQuestion(
      normalizedQuestion,
    );

    try {
      const apiResponse = await fetch(
        "/api/ask-searchpv",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            question:
              normalizedQuestion,
              debug: true,
          }),
        },
      );

      const payload =
        (await apiResponse.json()) as
          | AskSearchPVApiPayload
          | AskSearchPVApiError;

      console.log(
          "Ask SearchPV payload:",
          JSON.stringify(payload, null, 2),
        );

      if (!apiResponse.ok) {
        const errorPayload =
          payload as AskSearchPVApiError;

        throw new Error(
          errorPayload.error?.message ??
            "Ask SearchPV could not complete the request.",
        );
      }

      const successPayload =
        payload as AskSearchPVApiPayload;

      setResponse(
        successPayload.response,
      );

      const nextUrl =
        `/ask-searchpv?q=${encodeURIComponent(
          normalizedQuestion,
        )}`;

      window.history.replaceState(
        null,
        "",
        nextUrl,
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Ask SearchPV could not complete the request.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    void askSearchPV(question);
  }

  function handleSuggestedQuestion(
    suggestedQuestion: string,
  ) {
    setQuestion(suggestedQuestion);

    void askSearchPV(
      suggestedQuestion,
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-10 text-white md:px-8 md:py-14">
        <div className="mx-auto max-w-6xl">
          <Header />

          <div className="mx-auto mt-12 max-w-3xl text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-300 text-slate-950">
              <Bot size={29} />
            </div>

            <h1 className="mt-5 text-3xl font-black md:text-5xl">
              Ask SearchPV
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-slate-300">
              Ask about listings,
              neighborhoods, developments,
              prices, sales, inventory, or
              the Puerto Vallarta real estate
              market.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8"
            >
              <div className="flex flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-3 sm:flex-row">
                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-white px-4">
                  <Search
                    className="shrink-0 text-slate-400"
                    size={20}
                  />

                  <input
                    name="q"
                    type="search"
                    required
                    value={question}
                    onChange={(event) =>
                      setQuestion(
                        event.target.value,
                      )
                    }
                    placeholder="What would you like to know?"
                    className="min-h-14 w-full bg-transparent text-slate-950 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="min-h-14 rounded-2xl bg-cyan-300 px-7 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Searching..."
                    : "Ask SearchPV"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 md:px-8">
        {loading && (
          <LoadingCard
            question={
              submittedQuestion
            }
          />
        )}

        {!loading &&
          errorMessage && (
            <ErrorCard
              message={errorMessage}
            />
          )}

        {!loading &&
          !errorMessage &&
          response && (
            <SearchPVResponseView
              response={response}
              onSuggestedQuestion={
                handleSuggestedQuestion
              }
            />
          )}

        {!loading &&
          !errorMessage &&
          !response && (
            <StarterQuestions
              onQuestion={
                handleSuggestedQuestion
              }
            />
          )}
      </section>
    </main>
  );
}

function SearchPVResponseView({
  response,
  onSuggestedQuestion,
}: {
  response: AskSearchPVResponse;
  onSuggestedQuestion: (
    question: string,
  ) => void;
}) {
  return (
    <div className="space-y-6">
      <article className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
          Your Question
        </p>

        <p className="mt-2 text-base font-bold text-slate-700">
          {response.question}
        </p>

        <div className="mt-7 border-t border-slate-200 pt-7">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-cyan-700">
            Ask SearchPV
          </p>

          <h2 className="mt-3 text-2xl font-black text-slate-950">
            {
              response.answer
                .headline
            }
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-700">
            {
              response.answer
                .summary
            }
          </p>

          {response.answer
            .expertContext && (
            <p className="mt-4 leading-7 text-slate-600">
              {
                response.answer
                  .expertContext
              }
            </p>
          )}

          {response.answer.humor && (
            <p className="mt-4 italic leading-7 text-slate-500">
              {
                response.answer
                  .humor
              }
            </p>
          )}
        </div>
      </article>

      {response.blocks.map(
        (block, index) => (
          <ResponseBlock
            key={`${block.type}-${index}`}
            block={block}
            onSuggestedQuestion={
              onSuggestedQuestion
            }
          />
        ),
      )}

      {response.sources.length >
        0 && (
        <SourcesCard
          sources={
            response.sources
          }
        />
      )}

      {response
        .suggestedQuestions &&
        response
          .suggestedQuestions
          .length > 0 && (
          <SuggestedQuestions
            questions={
              response
                .suggestedQuestions
            }
            onQuestion={
              onSuggestedQuestion
            }
          />
        )}
    </div>
  );
}

function ResponseBlock({
  block,
  onSuggestedQuestion,
}: {
  block: AskSearchPVResponseBlock;
  onSuggestedQuestion: (
    question: string,
  ) => void;
}) {
  switch (block.type) {
    case "metric_cards":
      return (
        <MetricCardsBlock
          block={block}
        />
      );

    case "listing_table":
      return (
        <ListingTableBlock
          block={block}
        />
      );

    case "clarification":
      return (
        <ClarificationBlock
          block={block}
          onSuggestedQuestion={
            onSuggestedQuestion
          }
        />
      );

    default:
      return null;
  }
}

function MetricCardsBlock({
  block,
}: {
  block: Extract<
    AskSearchPVResponseBlock,
    {
      type: "metric_cards";
    }
  >;
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <h3 className="text-xl font-black text-slate-950">
        {block.title}
      </h3>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {block.metrics.map(
          (metric) => (
            <div
              key={
                metric.metricId
              }
              className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
            >
              <p className="text-sm font-bold text-slate-600">
                {metric.label}
              </p>

              <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                {metric.formattedValue ??
                  metric.value ??
                  "Unavailable"}
              </p>

              {metric.definition && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {
                    metric.definition
                  }
                </p>
              )}
            </div>
          ),
        )}
      </div>
    </section>
  );
}

function ListingTableBlock({
  block,
}: {
  block: Extract<
    AskSearchPVResponseBlock,
    {
      type: "listing_table";
    }
  >;
}) {
  const rows = block.rows;

  const totalCount =
    block.totalCount ?? rows.length;

  const columns =
    rows.length > 0
      ? Object.keys(
          rows[0] as unknown as Record<
            string,
            unknown
          >,
        ).slice(0, 8)
      : [];

  return (
    <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-7 py-5">
        <h3 className="text-xl font-black text-slate-950">
          {block.title}
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          {totalCount.toLocaleString(
            "en-US",
          )}{" "}
          matching properties
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="px-7 py-8 text-slate-600">
          No matching listings were
          found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                {columns.map(
                  (column) => (
                    <th
                      key={column}
                      className="whitespace-nowrap px-4 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500"
                    >
                      {formatColumnName(
                        column,
                      )}
                    </th>
                  ),
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {rows.map(
                (row, rowIndex) => {
                  const rowRecord =
                    row as unknown as Record<
                      string,
                      unknown
                    >;

                  return (
                    <tr
                      key={rowIndex}
                      className="hover:bg-slate-50"
                    >
                      {columns.map(
                        (column) => (
                          <td
                            key={
                              column
                            }
                            className="whitespace-nowrap px-4 py-4 text-slate-700"
                          >
                            {formatCellValue(
                              rowRecord[
                                column
                              ],
                            )}
                          </td>
                        ),
                      )}
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ClarificationBlock({
  block,
  onSuggestedQuestion,
}: {
  block: Extract<
    AskSearchPVResponseBlock,
    {
      type: "clarification";
    }
  >;
  onSuggestedQuestion: (
    question: string,
  ) => void;
}) {
  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-7">
      <h3 className="text-xl font-black text-slate-950">
        {block.question}
      </h3>

      {block.options &&
        block.options.length >
          0 && (
          <div className="mt-5 flex flex-wrap gap-3">
            {block.options.map(
              (option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() =>
                    onSuggestedQuestion(
                      option.label,
                    )
                  }
                  className="rounded-full border border-amber-300 bg-white px-5 py-3 text-left text-sm font-black text-slate-800 transition hover:border-cyan-400"
                >
                  <span>
                    {
                      option.label
                    }
                  </span>

                  {option.description && (
                    <span className="ml-2 font-normal text-slate-500">
                      {
                        option.description
                      }
                    </span>
                  )}
                </button>
              ),
            )}
          </div>
        )}
    </section>
  );
}

function SourcesCard({
  sources,
}: {
  sources: AskSearchPVResponse["sources"];
}) {
  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
        Sources
      </p>

      <div className="mt-4 space-y-4">
        {sources.map((source) => (
          <div
            key={source.id}
            className="border-l-4 border-cyan-300 pl-4"
          >
            <p className="font-black text-slate-900">
              {source.label}
            </p>

            <p className="mt-1 text-sm text-slate-500">
              {source.sourceName}
            </p>

            {source.dataCurrentAsOf && (
              <p className="mt-1 text-sm text-slate-600">
                Data current as of{" "}
                {formatDate(
                  source.dataCurrentAsOf,
                )}
              </p>
            )}

            {source.notes && (
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {source.notes}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

function SuggestedQuestions({
  questions,
  onQuestion,
}: {
  questions: string[];
  onQuestion: (
    question: string,
  ) => void;
}) {
  return (
    <section>
      <p className="text-xs font-black uppercase tracking-[0.15em] text-slate-500">
        Try another question
      </p>

      <div className="mt-3 flex flex-wrap gap-3">
        {questions.map(
          (suggestedQuestion) => (
            <button
              key={
                suggestedQuestion
              }
              type="button"
              onClick={() =>
                onQuestion(
                  suggestedQuestion,
                )
              }
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-left text-sm font-bold text-slate-800 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
            >
              {suggestedQuestion}
            </button>
          ),
        )}
      </div>
    </section>
  );
}

function StarterQuestions({
  onQuestion,
}: {
  onQuestion: (
    question: string,
  ) => void;
}) {
  const questions = [
    "How many active listings are in Versalles?",
    "Show me active condos under $600,000.",
    "What is the median sold price in Bucerías?",
    "Compare Marina Vallarta and Versalles.",
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {questions.map(
        (starterQuestion) => (
          <button
            key={starterQuestion}
            type="button"
            onClick={() =>
              onQuestion(
                starterQuestion,
              )
            }
            className="rounded-2xl border border-slate-200 bg-white p-5 text-left font-bold text-slate-800 shadow-sm transition hover:border-cyan-300 hover:shadow-md"
          >
            {starterQuestion}
          </button>
        ),
      )}

      <Link
        href="/search-properties"
        className="rounded-2xl border border-slate-200 bg-slate-950 p-5 text-left font-bold text-white shadow-sm transition hover:bg-slate-800"
      >
        Browse properties manually
      </Link>

      <Link
        href="/market-intelligence"
        className="rounded-2xl border border-slate-200 bg-white p-5 text-left font-bold text-slate-800 shadow-sm transition hover:border-cyan-300"
      >
        Explore market reports
      </Link>
    </div>
  );
}

function LoadingCard({
  question,
}: {
  question: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-cyan-500" />

        <div>
          <p className="font-black text-slate-950">
            Asking SearchPV
          </p>

          <p className="mt-1 text-sm text-slate-500">
            {question}
          </p>
        </div>
      </div>
    </div>
  );
}

function ErrorCard({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-3xl border border-red-200 bg-red-50 p-7">
      <p className="text-xs font-black uppercase tracking-[0.15em] text-red-700">
        Ask SearchPV Error
      </p>

      <h2 className="mt-3 text-xl font-black text-slate-950">
        The request could not be completed
      </h2>

      <p className="mt-3 leading-7 text-slate-700">
        {message}
      </p>
    </div>
  );
}

function formatColumnName(
  value: string,
): string {
  return value
    .replaceAll("_", " ")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase(),
    );
}

function formatCellValue(
  value: unknown,
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  if (typeof value === "number") {
    return value.toLocaleString(
      "en-US",
    );
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return String(value);
}

function formatDate(
  value: string,
): string {
  const date = new Date(
    `${value.slice(
      0,
      10,
    )}T00:00:00`,
  );

  if (
    Number.isNaN(date.getTime())
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  ).format(date);
}