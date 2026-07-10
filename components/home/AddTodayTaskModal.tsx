import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Brand, Ink, Radius } from '@/constants/theme';
import type { CustomerRow } from '@/hooks/use-customers';

type TaskDay = 'today' | 'tomorrow';

type Props = {
  open: boolean;
  onClose: () => void;
  customers: CustomerRow[];
  onSubmit: (params: {
    customerId?: string | null;
    title: string;
    note?: string | null;
    day?: TaskDay;
  }) => Promise<{ ok: boolean; error: string | null }>;
};

export function AddTodayTaskModal({ open, onClose, customers, onSubmit }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<CustomerRow | null>(null);
  const [note, setNote] = useState('');
  const [day, setDay] = useState<TaskDay>('today');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const results = useMemo(() => {
    if (query.trim() === '') return [];
    const q = query.trim();
    return customers.filter((c) => `${c.name}${c.branch_name ?? ''}`.includes(q)).slice(0, 20);
  }, [customers, query]);

  function reset() {
    setQuery('');
    setSelected(null);
    setNote('');
    setDay('today');
    setError(null);
  }

  function close() {
    reset();
    onClose();
  }

  async function submit() {
    if (!selected) {
      setError('顧客を選択してください');
      return;
    }
    setBusy(true);
    setError(null);
    const title = `${selected.name}${selected.branch_name ? ` ${selected.branch_name}` : ''}に連絡`;
    const r = await onSubmit({ customerId: selected.id, title, note: note.trim() || null, day });
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? '追加に失敗しました');
      return;
    }
    close();
  }

  return (
    <Modal transparent animationType="fade" visible={open} onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>➕ やることを追加</Text>
          <Text style={styles.sub}>顧客を選んで、タスクに追加します（前日の夜に明日の分を仕込めます）</Text>

          {/* 今日 / 明日 */}
          <View style={styles.dayRow}>
            {(
              [
                { key: 'today', label: '今日やる' },
                { key: 'tomorrow', label: '明日やる' },
              ] as { key: TaskDay; label: string }[]
            ).map((d) => (
              <Pressable
                key={d.key}
                onPress={() => setDay(d.key)}
                style={[styles.dayBtn, day === d.key && styles.dayBtnActive]}
              >
                <Text style={[styles.dayText, day === d.key && styles.dayTextActive]}>{d.label}</Text>
              </Pressable>
            ))}
          </View>

          {selected ? (
            <View style={styles.selectedBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedName}>
                  {selected.name}{selected.branch_name ? ` ${selected.branch_name}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => setSelected(null)}>
                <Text style={styles.selectedClear}>✕ 変更</Text>
              </Pressable>
            </View>
          ) : (
            <>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="店名で検索"
                placeholderTextColor={Ink[400]}
                style={styles.input}
              />
              {results.length > 0 ? (
                <View style={styles.resultList}>
                  {results.map((c) => (
                    <Pressable key={c.id} onPress={() => setSelected(c)} style={styles.resultRow}>
                      <Text style={styles.resultName}>
                        {c.name}{c.branch_name ? ` ${c.branch_name}` : ''}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              ) : query.trim() !== '' ? (
                <Text style={styles.noResult}>該当する顧客がありません</Text>
              ) : null}
            </>
          )}

          <View style={{ marginTop: 12 }}>
            <Text style={styles.fieldLabel}>メモ（任意）</Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="例: 新商品の見積を持っていく"
              placeholderTextColor={Ink[400]}
              multiline
              style={[styles.input, { minHeight: 60 }]}
            />
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button label="キャンセル" variant="secondary" size="md" fullWidth onPress={close} disabled={busy} />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label={day === 'tomorrow' ? '明日のやることに追加' : '今日のやることに追加'}
                variant="primary"
                size="md"
                fullWidth
                onPress={submit}
                disabled={!selected || busy}
                loading={busy}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,35,64,0.6)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 20, width: '100%', maxWidth: 480, maxHeight: '92%' },
  title: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 2, marginBottom: 14 },

  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[200], borderRadius: Radius.sm, padding: 10, fontSize: 14, color: Ink[900] },

  resultList: { marginTop: 8, maxHeight: 220, borderWidth: 1, borderColor: Ink[100], borderRadius: Radius.sm },
  resultRow: { padding: 12, borderBottomWidth: 1, borderBottomColor: Ink[100] },
  resultName: { fontSize: 13, color: Ink[900], fontWeight: '600' },
  noResult: { fontSize: 12, color: Ink[500], marginTop: 8, textAlign: 'center' },

  selectedBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Ink[50], borderRadius: Radius.sm, padding: 12, marginBottom: 4,
  },
  selectedName: { fontSize: 14, fontWeight: '800', color: Ink[900] },
  selectedClear: { fontSize: 11, color: Brand.navy, fontWeight: '700' },

  fieldLabel: { fontSize: 11, color: Ink[600], fontWeight: '700', marginBottom: 4 },

  dayRow: {
    flexDirection: 'row',
    backgroundColor: Ink[100],
    borderRadius: Radius.sm,
    padding: 3,
    gap: 3,
    marginBottom: 12,
  },
  dayBtn: { flex: 1, paddingVertical: 8, borderRadius: 6, alignItems: 'center' },
  dayBtnActive: { backgroundColor: '#fff' },
  dayText: { fontSize: 12, fontWeight: '700', color: Ink[500] },
  dayTextActive: { color: Brand.navy, fontWeight: '800' },

  error: { color: '#DC2626', fontSize: 12, marginTop: 10, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
});
