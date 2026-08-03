
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus } from 'lucide-react';

export default function BoardForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0,10));
  const [meetingNo, setMeetingNo] = useState('');
  const [decisions, setDecisions] = useState<any[]>([]);

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => (await api.get('/settings/facilities')).json()
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => (await api.get('/settings/definitions/categories')).json()
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: async () => (await api.get('/settings/definitions/departments')).json()
  });

  useEffect(() => {
    if (isEdit) {
      api.get(`/operations/board/${id}`).then(res => res.json()).then(data => {
        setSelectedFacility(data.facilityId);
        setMeetingDate(data.meetingDate.slice(0,10));
        setMeetingNo(data.meetingNo);
        setDecisions(data.decisions);
      });
    }
  }, [id, isEdit]);

  // Fetch previous uncompleted when facility changes (only for new)
  useEffect(() => {
    if (!isEdit && selectedFacility) {
      api.get(`/operations/board/facility/${selectedFacility}/previous-uncompleted`).then(res => res.json()).then(data => {
        if(data && data.length > 0) {
          const copied = data.map((d: any) => ({
            ...d,
            id: undefined,
            previousDecisionId: d.id
          }));
          setDecisions(copied);
        } else {
          setDecisions([]);
        }
      });
    }
  }, [selectedFacility, isEdit]);

  const addDecision = () => {
    setDecisions([...decisions, {
      decisionText: '',
      categoryId: '',
      departmentId: '',
      status: 'Başlamadı',
      deadlineDate: '',
      completionDate: '',
      resultExplanation: ''
    }]);
  };

  const removeDecision = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  const updateDecision = (index: number, field: string, value: any) => {
    const newDec = [...decisions];
    newDec[index][field] = value;
    setDecisions(newDec);
  };

  const handleSubmit = async () => {
    const payload = {
      facilityId: selectedFacility,
      meetingDate,
      meetingNo,
      decisions
    };
    if (isEdit) {
      await api.put(`/operations/board/${id}`, { json: payload }); // or use fetch with correct body format
    } else {
      await api.post('/operations/board', { json: payload }); // Adjust based on how api.js wraps fetch/ky/axios
    }
    navigate('/operations/board');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{isEdit ? 'Toplantı Düzenle' : 'Yeni Toplantı'}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/operations/board')}>İptal</Button>
          <Button onClick={handleSubmit}>Kaydet</Button>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Genel Bilgiler</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <div>
            <label>Tesis</label>
            <Select value={selectedFacility} onValueChange={setSelectedFacility} disabled={isEdit}>
              <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
              <SelectContent>
                {facilities.map((f: any) => <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label>Toplantı Tarihi</label>
            <Input type="date" value={meetingDate} onChange={e => setMeetingDate(e.target.value)} />
          </div>
          <div>
            <label>Toplantı No</label>
            <Input value={meetingNo} onChange={e => setMeetingNo(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Kararlar</CardTitle>
          <Button size="sm" onClick={addDecision}><Plus className="w-4 h-4 mr-1"/> Ekle</Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {decisions.map((dec, i) => (
              <div key={i} className="border p-4 rounded-lg grid grid-cols-4 gap-4">
                <div className="col-span-4">
                  <label>Karar Metni</label>
                  <Input value={dec.decisionText} onChange={e => updateDecision(i, 'decisionText', e.target.value)} />
                </div>
                <div>
                  <label>Kategori</label>
                  <Select value={dec.categoryId?.toString()} onValueChange={v => updateDecision(i, 'categoryId', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label>Departman (Sorumlu)</label>
                  <Select value={dec.departmentId?.toString()} onValueChange={v => updateDecision(i, 'departmentId', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map((d: any) => <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label>Durum</label>
                  <Select value={dec.status} onValueChange={v => updateDecision(i, 'status', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Başlamadı">Başlamadı</SelectItem>
                      <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                      <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                      <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label>Termin Tarihi</label>
                  <Input type="date" value={dec.deadlineDate?.slice(0,10) || ''} onChange={e => updateDecision(i, 'deadlineDate', e.target.value)} />
                </div>
                <div className="col-span-3">
                  <label>Sonuç / Açıklama</label>
                  <Input value={dec.resultExplanation || ''} onChange={e => updateDecision(i, 'resultExplanation', e.target.value)} />
                </div>
                <div className="flex items-end justify-end">
                  <Button variant="destructive" onClick={() => removeDecision(i)}><Trash2 className="w-4 h-4"/></Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
