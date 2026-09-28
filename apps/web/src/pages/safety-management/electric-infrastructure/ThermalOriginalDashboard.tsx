import React, { useMemo, useState } from 'react';
import type { ThermalInspectionSession, ThermalInspectionItem } from '@/services/thermal-inspection.service';

interface Props {
  session: ThermalInspectionSession;
  onBack?: () => void;
  onAddPhoto?: (item: any) => void;
  onEditItem?: (item: any) => void;
  onDeleteItem?: (itemId: string) => void;
}

export const ThermalOriginalDashboard: React.FC<Props> = ({ session, onBack, onAddPhoto, onEditItem, onDeleteItem }) => {
  const [q, setQ] = useState('');
  const [floor, setFloor] = useState('');
  const [status, setStatus] = useState('');

  const items = Array.isArray(session?.items) ? session.items : [];
  
  const hospitalName = session?.facility?.name || 'Bilinmeyen Tesis';
  const dates = [...new Set((items || []).map(it => {
    if(it.measurementDate) return new Date(it.measurementDate).toLocaleDateString('tr-TR');
    if(it.createdAt) return new Date(it.createdAt).toLocaleDateString('tr-TR');
    return '';
  }).filter(Boolean))];
  const dateRange = dates.length === 1 ? dates[0] : dates.length > 1 ? `${dates[0]} – ${dates[dates.length-1]}` : '—';

  const totalCount = items.length;
  const normalCount = items.filter(r => (r.status || '').toLowerCase() === 'normal').length;
  const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);
  const normalRate = totalCount ? ('%' + fmt((normalCount / totalCount) * 100)) : '—';

  const temps = items.map(r => r.measuredTemp).filter((x): x is number => typeof x === 'number' && !isNaN(x));
  const avg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
  const mx = temps.length ? Math.max(...temps) : 0;

  const mrow = items.find(r => r.measuredTemp === mx);
  const maxEquip = mrow ? (mrow.equipmentConnection || mrow.panelName) : '—';

  const highDelta = items.filter(r => r.deltaTemp !== null && r.deltaTemp !== undefined && r.deltaTemp >= 20);
  const deltaCount = highDelta.length;
  let deltaNote = 'ΔT ≥ 20 °C olan kayıt bulunmuyor.';
  if (highDelta.length) {
    const x = [...highDelta].sort((a, b) => (b.deltaTemp || 0) - (a.deltaTemp || 0))[0];
    deltaNote = `<b>Dikkat:</b> ${highDelta.length} kayıtta ΔT ≥ 20 °C. En yüksek fark <b>${fmt(x.deltaTemp || 0)} °C</b> — ${x.equipmentConnection || x.panelName}. Bu gösterge formdaki "Durum" alanından bağımsız hesaplanmıştır.`;
  }

  // Floors
  const c: Record<string, number> = {};
  items.forEach(r => {
    let k = r.floorSection || 'Belirsiz';
    c[k] = (c[k] || 0) + 1;
  });
  const floorArr = Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const maxFloor = floorArr.length ? Math.max(...floorArr.map(x => x[1])) : 1;

  // Donut
  const p = totalCount ? (normalCount / totalCount) * 100 : 0;
  const donutBg = `conic-gradient(var(--ok) 0 ${p}%, #e8eef4 ${p}% 100%)`;

  // Spark
  const minTemp = temps.length ? Math.min(...temps) : 0;
  const maxTempScale = temps.length ? Math.max(...temps) : 1;
  
  // Filters
  const uniqueFloors = [...new Set(items.map(r => r.floorSection).filter(Boolean))].sort();
  const uniqueStatuses = [...new Set(items.map(r => r.status).filter(Boolean))].sort();

  const filteredItems = items.filter(r => {
    if (floor && r.floorSection !== floor) return false;
    if (status && r.status !== status) return false;
    if (q) {
      const qLower = q.toLocaleLowerCase('tr-TR');
      const text = [r.panelName, r.equipmentConnection, r.floorSection, r.status].join(' ').toLocaleLowerCase('tr-TR');
      if (!text.includes(qLower)) return false;
    }
    return true;
  });

  return (
    <div className="thermal-dashboard-wrapper text-left" style={{ background: '#f4f7fb', minHeight: '100vh' }}>
      <style>{`
        .thermal-dashboard-wrapper {
          --bg: #f4f7fb;
          --card: #fff;
          --ink: #102033;
          --muted: #6b7a90;
          --teal: #00a6a6;
          --teal2: #087f8c;
          --navy: #163a5f;
          --line: #dfe7ef;
          --ok: #168a65;
          --warn: #d98517;
          --danger: #c94b4b;
          --shadow: 0 10px 30px rgba(20,55,85,.09);
          font-family: Inter, Segoe UI, Arial, sans-serif;
          color: var(--ink);
          padding: 24px;
        }
        .thermal-dashboard-wrapper .shell { max-width: 1700px; margin: auto; }
        .thermal-dashboard-wrapper .hero {
          background: linear-gradient(125deg, var(--navy), #0a6274 60%, var(--teal));
          color: white; border-radius: 20px; padding: 28px 30px; box-shadow: var(--shadow);
          display: flex; justify-content: space-between; gap: 20px; align-items: flex-end;
        }
        .thermal-dashboard-wrapper .hero h1 { margin: 0 0 7px; font-size: 28px; letter-spacing: .2px; font-weight: bold; }
        .thermal-dashboard-wrapper .hero p { margin: 0; color: #dceaf2; font-size: 14px; }
        .thermal-dashboard-wrapper .stamp { text-align: right; font-size: 13px; opacity: .9; }
        .thermal-dashboard-wrapper .kpis {
          display: grid; grid-template-columns: repeat(5, minmax(150px, 1fr)); gap: 14px; margin: 18px 0;
        }
        .thermal-dashboard-wrapper .kcard {
          background: var(--card); border: 1px solid var(--line); border-radius: 16px; box-shadow: var(--shadow);
        }
        .thermal-dashboard-wrapper .kpi { padding: 18px; }
        .thermal-dashboard-wrapper .kpi .label { color: var(--muted); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; }
        .thermal-dashboard-wrapper .kpi .value { font-size: 28px; font-weight: 800; margin-top: 8px; }
        .thermal-dashboard-wrapper .kpi .sub { font-size: 12px; color: var(--muted); margin-top: 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .thermal-dashboard-wrapper .value.ok { color: var(--ok); }
        .thermal-dashboard-wrapper .value.warn { color: var(--warn); }
        
        .thermal-dashboard-wrapper .kgrid { display: grid; grid-template-columns: 1.35fr 1fr 1fr; gap: 14px; margin-bottom: 20px; }
        .thermal-dashboard-wrapper .panel { padding: 18px; min-height: 280px; }
        .thermal-dashboard-wrapper .panel h3 { font-size: 14px; margin: 0 0 4px; font-weight: bold; }
        .thermal-dashboard-wrapper .panel .hint { font-size: 12px; color: var(--muted); margin-bottom: 16px; }
        
        .thermal-dashboard-wrapper .bars { display: flex; flex-direction: column; gap: 10px; }
        .thermal-dashboard-wrapper .barrow { display: grid; grid-template-columns: 90px 1fr 34px; gap: 10px; align-items: center; font-size: 12px; }
        .thermal-dashboard-wrapper .barrow span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .thermal-dashboard-wrapper .track { height: 9px; border-radius: 10px; background: #e8eef4; overflow: hidden; }
        .thermal-dashboard-wrapper .fill { height: 100%; background: linear-gradient(90deg, var(--teal), var(--navy)); border-radius: 10px; }
        
        .thermal-dashboard-wrapper .donutwrap { display: flex; align-items: center; justify-content: center; height: 190px; }
        .thermal-dashboard-wrapper .donut { width: 160px; height: 160px; border-radius: 50%; position: relative; }
        .thermal-dashboard-wrapper .donut:after { content: ""; position: absolute; inset: 26px; background: white; border-radius: 50%; }
        .thermal-dashboard-wrapper .donuttext { position: absolute; z-index: 2; text-align: center; top: 50%; left: 50%; transform: translate(-50%, -50%); }
        .thermal-dashboard-wrapper .donuttext b { display: block; font-size: 30px; font-weight: bold; }
        .thermal-dashboard-wrapper .donuttext span { font-size: 12px; color: var(--muted); }
        
        .thermal-dashboard-wrapper .alertbox { border-left: 4px solid var(--warn); background: #fff8ec; padding: 13px 14px; border-radius: 10px; font-size: 13px; line-height: 1.45; margin-top: 10px; }
        .thermal-dashboard-wrapper .spark { height: 170px; display: flex; align-items: flex-end; gap: 5px; border-bottom: 1px solid var(--line); padding: 0 4px; overflow-x: auto; }
        .thermal-dashboard-wrapper .spark i { display: block; flex: 1; min-width: 8px; background: linear-gradient(var(--teal), var(--navy)); border-radius: 4px 4px 0 0; opacity: .82; position: relative; }
        .thermal-dashboard-wrapper .spark i.hot { background: linear-gradient(#f2a93b, #c94b4b); }
        
        .thermal-dashboard-wrapper .tablecard { overflow: hidden; }
        .thermal-dashboard-wrapper .toolbar { display: flex; gap: 10px; flex-wrap: wrap; justify-content: space-between; align-items: center; padding: 16px 18px; border-bottom: 1px solid var(--line); }
        .thermal-dashboard-wrapper .toolbar h2 { margin: 0; font-size: 18px; font-weight: bold; }
        .thermal-dashboard-wrapper .filters { display: flex; gap: 8px; flex-wrap: wrap; }
        .thermal-dashboard-wrapper .filters input, .thermal-dashboard-wrapper .filters select { border: 1px solid #cad6e2; border-radius: 9px; padding: 9px 11px; background: white; min-width: 150px; color: var(--ink); font-size: 13px; outline: none; }
        .thermal-dashboard-wrapper .btn { border: 0; background: var(--navy); color: white; padding: 10px 14px; border-radius: 9px; font-weight: 700; cursor: pointer; font-size: 13px; display: inline-flex; align-items: center; gap: 6px; }
        
        .thermal-dashboard-wrapper .scroll { overflow: auto; max-height: 620px; }
        .thermal-dashboard-wrapper table { border-collapse: separate; border-spacing: 0; width: 100%; min-width: 1300px; font-size: 12px; }
        .thermal-dashboard-wrapper thead th { position: sticky; top: 0; z-index: 2; background: var(--teal); color: white; padding: 11px 9px; border-right: 1px solid rgba(255,255,255,.2); text-align: center; white-space: nowrap; font-weight: 600; }
        .thermal-dashboard-wrapper tbody td { padding: 9px 8px; border-right: 1px solid var(--line); border-bottom: 1px solid var(--line); vertical-align: top; background: white; }
        .thermal-dashboard-wrapper tbody tr:nth-child(even) td { background: #f9fbfd; }
        .thermal-dashboard-wrapper tbody tr:hover td { background: #edf9f9; }
        .thermal-dashboard-wrapper .num { text-align: center; }
        .thermal-dashboard-wrapper .temp { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
        .thermal-dashboard-wrapper .pill { display: inline-flex; padding: 4px 8px; border-radius: 999px; font-weight: 800; font-size: 11px; }
        .thermal-dashboard-wrapper .pill.ok { background: #e7f6ef; color: #137553; }
        .thermal-dashboard-wrapper .pill.routine { background: #edf3fb; color: #315b88; }
        .thermal-dashboard-wrapper .pill.hot { background: #fff0df; color: #ad5b00; }
        .thermal-dashboard-wrapper .foot { display: flex; justify-content: space-between; color: var(--muted); font-size: 12px; padding: 11px 18px; border-top: 1px solid var(--line); }
        
        @media(max-width:1050px){
          .thermal-dashboard-wrapper .kpis{grid-template-columns:repeat(2,1fr)}
          .thermal-dashboard-wrapper .kgrid{grid-template-columns:1fr}
          .thermal-dashboard-wrapper .hero{align-items:flex-start;flex-direction:column}
          .thermal-dashboard-wrapper .stamp{text-align:left}
        }
        @media(max-width:600px){
          .thermal-dashboard-wrapper { padding: 10px; }
          .thermal-dashboard-wrapper .kpis{grid-template-columns:1fr 1fr}
          .thermal-dashboard-wrapper .kpi .value{font-size:22px}
          .thermal-dashboard-wrapper .hero{padding:20px}
          .thermal-dashboard-wrapper .hero h1{font-size:21px}
        }
      `}</style>

      <div className="shell">
        <section className="hero">
          <div>
            <h1>Termal Kamera ile Elektrik Pano Kontrolü</h1>
            <p>Ölçüm özeti, sıcaklık görünümü ve kayıt listesi</p>
            {onBack && (
              <button onClick={onBack} className="btn" style={{ marginTop: '14px', background: 'rgba(255,255,255,0.2)' }}>
                ← Geri Dön
              </button>
            )}
          </div>
          <div className="stamp">
            <b>{hospitalName}</b><br />
            <span>{dateRange}</span>
          </div>
        </section>

        <section className="kpis">
          <div className="kcard kpi">
            <div className="label">Toplam Kontrol</div>
            <div className="value">{totalCount}</div>
            <div className="sub">kayıt</div>
          </div>
          <div className="kcard kpi">
            <div className="label">Normal</div>
            <div className="value ok">{normalCount}</div>
            <div className="sub">{normalRate}</div>
          </div>
          <div className="kcard kpi">
            <div className="label">Ortalama Sıcaklık</div>
            <div className="value">{fmt(avg)} °C</div>
            <div className="sub">ölçülen değer</div>
          </div>
          <div className="kcard kpi">
            <div className="label">Maks. Sıcaklık</div>
            <div className="value warn">{fmt(mx)} °C</div>
            <div className="sub" title={maxEquip}>{maxEquip}</div>
          </div>
          <div className="kcard kpi">
            <div className="label">ΔT ≥ 20 °C</div>
            <div className="value warn">{deltaCount}</div>
            <div className="sub">ölçüm − ortam</div>
          </div>
        </section>

        <section className="kgrid">
          <div className="kcard panel">
            <h3>Kat / Bölüm Bazında Kontrol Sayısı</h3>
            <div className="hint">En çok kontrol yapılan alanlar</div>
            <div className="bars">
              {floorArr.map(([k, v]) => (
                <div className="barrow" key={k}>
                  <span title={k}>{k}</span>
                  <div className="track"><div className="fill" style={{ width: `${(v / maxFloor) * 100}%` }}></div></div>
                  <b>{v}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="kcard panel">
            <h3>Durum Dağılımı</h3>
            <div className="hint">Formdaki "Durum" alanına göre</div>
            <div className="donutwrap">
              <div className="donut" style={{ background: donutBg }}>
                <div className="donuttext">
                  <b>{normalCount}</b>
                  <span>Normal</span>
                </div>
              </div>
            </div>
          </div>
          <div className="kcard panel">
            <h3>Sıcaklık Profili</h3>
            <div className="hint">Her sütun bir ölçümü gösterir</div>
            <div className="spark">
              {temps.map((t, idx) => {
                const height = 18 + ((t - minTemp) / (maxTempScale - minTemp || 1)) * 145;
                return <i key={idx} title={`${fmt(t)} °C`} className={t >= 50 ? 'hot' : ''} style={{ height: `${height}px` }}></i>;
              })}
            </div>
            <div className="alertbox" dangerouslySetInnerHTML={{ __html: deltaNote }}></div>
          </div>
        </section>

        <section className="kcard tablecard">
          <div className="toolbar">
            <div>
              <h2>Ölçüm Listesi</h2>
              <div className="hint" style={{ margin: '4px 0 0' }}>Excel formundaki kayıtlar</div>
            </div>
            <div className="filters">
              <input value={q} onChange={e => setQ(e.target.value)} placeholder="Listede ara…" />
              <select value={floor} onChange={e => setFloor(e.target.value)}>
                <option value="">Tüm katlar</option>
                {uniqueFloors.map(f => f ? <option key={f} value={f}>{f}</option> : null)}
              </select>
              <select value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Tüm durumlar</option>
                {uniqueStatuses.map(s => s ? <option key={s} value={s}>{s}</option> : null)}
              </select>
            </div>
          </div>
          <div className="scroll">
            <table>
              <thead>
                <tr>
                  <th>No</th>
                  <th>Lokasyon / Bina</th>
                  <th>Kat / Bölüm</th>
                  <th>Tarih</th>
                  <th>Saat</th>
                  <th>Pano No / Adı</th>
                  <th>Ekipman / Bağlantı</th>
                  <th>Ölçülen (°C)</th>
                  <th>Ortam (°C)</th>
                  <th>Durum</th>
                  <th>Öncelik</th>
                  <th>Tespit / Açıklama</th>
                  <th>Aksiyon</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((r, i) => (
                  <tr key={r.id}>
                    <td className="num">{r.orderIndex || i + 1}</td>
                    <td>{r.buildingLocation || 'Hastane Geneli'}</td>
                    <td>{r.floorSection}</td>
                    <td>{r.measurementDate ? new Date(r.measurementDate).toLocaleDateString('tr-TR') : ''}</td>
                    <td>{r.controlTime}</td>
                    <td>{r.panelName}</td>
                    <td>{r.equipmentConnection}</td>
                    <td className="temp">{r.measuredTemp !== null && r.measuredTemp !== undefined ? fmt(r.measuredTemp) : ''}</td>
                    <td className="temp">{r.ambientTemp !== null && r.ambientTemp !== undefined ? fmt(r.ambientTemp) : ''}</td>
                    <td>
                      <span className={`pill ${(r.status || '').toLowerCase() === 'normal' ? 'ok' : 'hot'}`}>
                        {r.status || 'Normal'}
                      </span>
                    </td>
                    <td>
                      <span className="pill routine">{r.priority || 'Rutin'}</span>
                    </td>
                    <td>{r.detectedRisk || r.actionTaken || 'Anormal sıcaklık yok'}</td>
                    <td>{r.actionTaken || 'Yok'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="foot">
            <span>{filteredItems.length} kayıt gösteriliyor</span>
            <span>Kaynak: yüklenen konsolide kontrol formu</span>
          </div>
        </section>
      </div>
    </div>
  );
};
