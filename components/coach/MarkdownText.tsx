import { Text, View } from 'react-native';

type InlineSegment = { text: string; bold?: boolean; italic?: boolean };

/**
 * Splits a line into bold/italic/plain runs. Deliberately minimal — handles
 * `**bold**` and `*italic*`, nothing nested, no escaping. Enough for coach
 * replies; a real markdown parser would be overkill for single-line spans.
 */
function parseInline(line: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  const pattern = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(line)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ text: line.slice(lastIndex, match.index) });
    }
    if (match[1] !== undefined) {
      segments.push({ text: match[1], bold: true });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], italic: true });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < line.length) {
    segments.push({ text: line.slice(lastIndex) });
  }
  return segments.length > 0 ? segments : [{ text: line }];
}

type Block =
  | { type: 'paragraph'; line: string }
  | { type: 'bullet'; line: string }
  | { type: 'numbered'; index: number; line: string };

function parseBlocks(content: string): Block[] {
  return content
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const bulletMatch = /^[-•]\s+(.*)/.exec(line);
      if (bulletMatch) return { type: 'bullet', line: bulletMatch[1] } as const;
      const numberedMatch = /^(\d+)\.\s+(.*)/.exec(line);
      if (numberedMatch) {
        return { type: 'numbered', index: Number(numberedMatch[1]), line: numberedMatch[2] } as const;
      }
      return { type: 'paragraph', line } as const;
    });
}

function InlineRuns({ line, className }: { line: string; className: string }) {
  return (
    <Text className={className}>
      {parseInline(line).map((seg, i) => (
        <Text
          key={i}
          className={`${seg.bold ? 'font-bold' : ''} ${seg.italic ? 'italic' : ''}`}>
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

type MarkdownTextProps = {
  content: string;
  className: string;
};

/** Renders coach/assistant message text with bold, italics, bullets, and numbered lists. */
export default function MarkdownText({ content, className }: MarkdownTextProps) {
  const blocks = parseBlocks(content);

  return (
    <View>
      {blocks.map((block, i) => {
        if (block.type === 'bullet') {
          return (
            <View key={i} className="mt-1 flex-row">
              <Text className={className}>{'•  '}</Text>
              <InlineRuns line={block.line} className={`flex-1 ${className}`} />
            </View>
          );
        }
        if (block.type === 'numbered') {
          return (
            <View key={i} className="mt-1 flex-row">
              <Text className={className}>{block.index}. </Text>
              <InlineRuns line={block.line} className={`flex-1 ${className}`} />
            </View>
          );
        }
        return (
          <View key={i} className={i > 0 ? 'mt-2' : undefined}>
            <InlineRuns line={block.line} className={className} />
          </View>
        );
      })}
    </View>
  );
}
