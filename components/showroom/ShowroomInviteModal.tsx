import { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { Button } from '@/components/ui/Button';
import { Accent, Brand, Ink, Radius } from '@/constants/theme';
import {
  inviteCustomerToShowroom,
  SHOWROOM_HOURS,
  useShowroomSlots,
} from '@/hooks/use-showroom-slots';

function notify(msg: string) {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(msg);
  } else {
    Alert.alert('完了', msg);
  }
}

type Props = {
  open: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
};

export function ShowroomInviteModal({ open, onClose, customerId, customerName }: Props) {
  const { slots, loading, reload } = useShowroomSlots(undefined, 14);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [numVisitors, setNumVisitors] = useState('1');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  // 日付別グルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, Map<number, typeof slots[number]>>();
    for (const s of slots) {
      if (s.slot_date < today) continue; // 過去日除外
      if (!map.has(s.slot_date)) map.set(s.slot_date, new Map());
      map.get(s.slot_date)!.set(s.slot_hour, s);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [slots, today]);

  const reset = () => {
    setSelectedDate(null);
    setSelectedHour(null);
    setNumVisitors('1');
    setNotes('');
    setError(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  async function submit() {
    if (!selectedDate || selectedHour === null) {
      setError('日時を選択してください');
      return;
    }
    setError(null);
    setBusy(true);
    const scheduledAt = `${selectedDate}T${String(selectedHour).padStart(2, '0')}:00:00+09:00`;
    const r = await inviteCustomerToShowroom(
      customerId,
      scheduledAt,
      Number(numVisitors) || undefined,
      notes.trim() || undefined,
    );
    setBusy(false);
    if (!r.ok) {
      setError(r.error ?? '招待作成失敗');
      return;
    }
    notify(`✅ ${customerName} をショールームに招待しました`);
    reload();
    close();
  }

  return (
    <Modal transparent animationType="fade" visible={open} onRequestClose={close}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>🏬 ショールームに招待</Text>
          <Text style={styles.sub}>{customerName}</Text>

          {loading ? (
            <Text style={styles.loading}>空き枠を取得中...</Text>
          ) : (
            <>
              <Text style={styles.section}>日時を選択</Text>
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#D1FAE5' }]} />
                  <Text style={styles.legendText}>空き</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: '#FEF3C7' }]} />
                  <Text style={styles.legendText}>埋まり</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.dot, { backgroundColor: Brand.gold }]} />
                  <Text style={styles.legendText}>選択中</Text>
                </View>
              </View>

              <View style={styles.gridScroll}>
                <View style={styles.gridHeader}>
                  <Text style={styles.gridDateHeader} />
                  {SHOWROOM_HOURS.map((h) => (
                    <Text key={h} style={styles.gridHourHeader}>{h}時</Text>
                  ))}
                </View>
                {grouped.slice(0, 14).map(([date, hourMap]) => {
                  const d = new Date(date + 'T00:00:00+09:00');
                  const dow = '日月火水木金土'[d.getDay()];
                  const isToday = date === today;
                  return (
                    <View key={date} style={styles.gridRow}>
                      <Text style={[styles.gridDate, isToday && { color: Brand.gold, fontWeight: '900' }]}>
                        {d.getMonth() + 1}/{d.getDate()}({dow})
                      </Text>
                      {SHOWROOM_HOURS.map((h) => {
                        const s = hourMap.get(h);
                        const av = s?.availability ?? 'available';
                        const isSelected = selectedDate === date && selectedHour === h;
                        const bg = isSelected
                          ? Brand.gold
                          : av === 'available'
                            ? '#D1FAE5'
                            : av === 'booked'
                              ? '#FEF3C7'
                              : '#FEE2E2';
                        return (
                          <Pressable
                            key={h}
                            onPress={() => {
                              if (av !== 'available') {
                                setError('この時間は既に予約済です。別の枠を選んでください。');
                                return;
                              }
                              setError(null);
                              setSelectedDate(date);
                              setSelectedHour(h);
                            }}
                            style={[styles.gridCell, { backgroundColor: bg }]}
                          >
                            <Text
                              style={[
                                styles.gridCellText,
                                isSelected && { color: '#fff', fontWeight: '900' },
                              ]}
                            >
                              {av === 'available' ? '○' : '×'}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  );
                })}
              </View>

              {selectedDate && selectedHour !== null ? (
                <View style={styles.confirmBox}>
                  <Text style={styles.confirmLabel}>選択中：</Text>
                  <Text style={styles.confirmValue}>
                    {selectedDate} {String(selectedHour).padStart(2, '0')}:00 〜 {String(selectedHour + 1).padStart(2, '0')}:00
                  </Text>

                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.fieldLabel}>来場人数</Text>
                    <TextInput
                      value={numVisitors}
                      onChangeText={setNumVisitors}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={Ink[400]}
                      style={styles.input}
                    />
                  </View>

                  <View style={{ marginTop: 10 }}>
                    <Text style={styles.fieldLabel}>備考（任意）</Text>
                    <TextInput
                      value={notes}
                      onChangeText={setNotes}
                      placeholder="試食したい商品など"
                      placeholderTextColor={Ink[400]}
                      multiline
                      style={[styles.input, { minHeight: 60 }]}
                    />
                  </View>
                </View>
              ) : null}
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actionRow}>
            <View style={{ flex: 1 }}>
              <Button label="キャンセル" variant="secondary" size="md" fullWidth onPress={close} disabled={busy} />
            </View>
            <View style={{ flex: 2 }}>
              <Button
                label="招待を確定"
                variant="primary"
                size="md"
                fullWidth
                onPress={submit}
                disabled={!selectedDate || selectedHour === null || busy}
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
  card: { backgroundColor: '#fff', borderRadius: Radius.lg, padding: 20, width: '100%', maxWidth: 540, maxHeight: '92%' },
  title: { fontSize: 18, fontWeight: '800', color: Ink[900] },
  sub: { fontSize: 12, color: Ink[500], marginTop: 2, marginBottom: 14 },
  loading: { fontSize: 13, color: Ink[500], textAlign: 'center', padding: 20 },
  section: { fontSize: 12, color: Ink[500], fontWeight: '700', letterSpacing: 1, marginBottom: 8 },

  legendRow: { flexDirection: 'row', gap: 12, justifyContent: 'flex-end', marginBottom: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 10, color: Ink[600] },

  gridScroll: { maxHeight: 280 },
  gridHeader: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 4 },
  gridDateHeader: { width: 64 },
  gridHourHeader: { flex: 1, fontSize: 10, color: Ink[500], fontWeight: '700', textAlign: 'center' },
  gridRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginBottom: 2 },
  gridDate: { width: 64, fontSize: 11, color: Ink[700], fontWeight: '600' },
  gridCell: { flex: 1, paddingVertical: 8, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  gridCellText: { fontSize: 12, fontWeight: '700', color: Ink[800] },

  confirmBox: { marginTop: 14, padding: 12, backgroundColor: Ink[50], borderRadius: Radius.md },
  confirmLabel: { fontSize: 11, color: Ink[500], fontWeight: '700' },
  confirmValue: { fontSize: 14, color: Ink[900], fontWeight: '800', marginTop: 2 },
  fieldLabel: { fontSize: 11, color: Ink[600], fontWeight: '700', marginBottom: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: Ink[200], borderRadius: Radius.sm, padding: 10, fontSize: 14, color: Ink[900] },

  error: { color: Accent.red, fontSize: 12, marginTop: 10, textAlign: 'center' },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
});
