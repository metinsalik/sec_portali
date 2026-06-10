import React from 'react';
// this is just to syntax highlight and prepare the layout snippet.
export const jsx = `
      <div className="space-y-6">
        {/* Bölüm 1: Genel Bilgiler */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">1. Bölüm: Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Tespit Tarihi *
                </label>
                <Input type="date" value={form.detectionDate} onChange={(e) => updateField('detectionDate', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Risk Kategorisi *</label>
                <select value={form.riskCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {categoryOptions.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Alt Risk Kategorisi *</label>
                <select value={form.subCategory} onChange={(e) => updateField('subCategory', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={!form.riskCategory}>
                  <option value="">Seçiniz...</option>
                  {subCategoryOptions.map((sc: any) => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Bölüm *</label>
                <Input value={department?.name || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Alan *</label>
                <select value={form.area} onChange={(e) => updateField('area', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {hospitalDepartments.map((h: any) => <option key={h.id} value={h.name}>{h.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Faaliyet (Yapılan İş) *</label>
                <Input value={form.activity} onChange={(e) => updateField('activity', e.target.value)} placeholder="Örn: Kimyasal atıkların taşınması" />
              </div>
            </div>
            {isEdit && (
              <div className="w-1/3 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sıra No (Risk No)</label>
                <Input type="number" value={form.riskNo} onChange={(e) => updateField('riskNo', e.target.value)} placeholder="Örn: 1" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bölüm 2: Mevcut Durum Değerlendirmesi */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">2. Bölüm: Mevcut Durum Değerlendirmesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tehlike *</label>
                <Input value={form.hazard} onChange={(e) => updateField('hazard', e.target.value)} placeholder="Örn: Koruyucu eldiven kullanılmaması" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Risk *</label>
                <Input value={form.riskDescription} onChange={(e) => updateField('riskDescription', e.target.value)} placeholder="Örn: Kimyasalın cilde teması sonucu yanık" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sonuç / Olası Etki Zarar</label>
                <Input value={form.impactDamage} onChange={(e) => updateField('impactDamage', e.target.value)} placeholder="Örn: Yaralanma, İş gücü kaybı" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Riskten Etkilenecek Kişiler</label>
                <Input value={form.affectedPeople} onChange={(e) => updateField('affectedPeople', e.target.value)} placeholder="Örn: Hemşireler, Temizlik Personeli" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mevcut Durum Açıklaması (Tespit edilen riske ilişkin mevcut önlemler) *</label>
              <Textarea value={form.initialCondition} onChange={(e) => updateField('initialCondition', e.target.value)} placeholder="Açıklama giriniz..." rows={2} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Mevcut Durum Görseli</label>
              <div className="flex flex-wrap items-center gap-4 border p-3 rounded-lg bg-muted/10">
                {form.initialImage ? (
                  <div className="relative group w-28 h-20 rounded-md overflow-hidden border">
                    <img src={form.initialImage} alt="Mevcut Durum" className="w-full h-full object-cover" />
                    <a href={form.initialImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition-opacity font-medium">Görüntüle</a>
                  </div>
                ) : (
                  <div className="w-28 h-20 bg-muted/40 rounded-md border border-dashed flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/50" /><span>Görsel Yok</span>
                  </div>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed rounded-md px-4 py-2 hover:border-foreground/40 transition-colors bg-background">
                  {uploadingField === 'initialImage' ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4" />}
                  Fotoğraf Yükle
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage('initialImage', e.target.files[0]); }} />
                </label>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <h5 className="text-sm font-bold mb-4">Mevcut Risk Skoru</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Olasılık (P)</label>
                  <select value={form.initialProb} onChange={(e) => handleScoreInput('initialProb', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {PROBABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Frekans (F)</label>
                  <select value={form.initialFreq} onChange={(e) => handleScoreInput('initialFreq', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Şiddet (S)</label>
                  <select value={form.initialSev} onChange={(e) => handleScoreInput('initialSev', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Risk Puanı</span>
                  <span className="text-2xl font-extrabold">{form.initialScore || '0'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">Risk Seviyesi</span>
                  <Badge variant="outline" className={\`font-semibold \${initialLevelInfo.badge}\`}>{initialLevelInfo.label}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">İlgili Mevzuat</label>
              <Textarea value={form.legislation} onChange={(e) => updateField('legislation', e.target.value)} placeholder="Örn: 6331 Sayılı İSG Kanunu" rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Bölüm 3: İyileştirme Planı / Uygulama */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">3. Bölüm: İyileştirme Planı / Uygulama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Alınacak Önlemler / İyileştirici Faaliyet</label>
              <Textarea value={form.actionsTaken} onChange={(e) => updateField('actionsTaken', e.target.value)} placeholder="Açıklama giriniz..." rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">İyileştirme Sorumlusu</label>
                <select value={form.improvementResponsible} onChange={(e) => updateField('improvementResponsible', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {settingsDepartments.map((dept: any) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Termin Tarihi *</label>
                <Input type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Termin Periyodu</label>
                <select value={form.dueDatePeriod} onChange={(e) => updateField('dueDatePeriod', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Belli bir tarih</option>
                  <option value="Sürekli">Sürekli</option>
                  <option value="1 Ay">1 Ay</option>
                  <option value="3 Ay">3 Ay</option>
                  <option value="6 Ay">6 Ay</option>
                  <option value="1 Yıl">1 Yıl</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">İyileştirme Açıklaması (Tespit edilen riske ilişkin yapılan iyileştirmeler)</label>
              <Textarea value={form.actionsTaken} onChange={(e) => updateField('actionsTaken', e.target.value)} placeholder="Açıklama giriniz..." rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">İyileştirme Tamamlanma Tarihi</label>
                <Input type="date" value={form.actionDate} onChange={(e) => updateField('actionDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">İyileştirme Sonrası Görseli</label>
                <div className="flex items-center gap-3">
                  {form.actionImage && (
                    <div className="relative group w-20 h-10 rounded border overflow-hidden shrink-0">
                      <img src={form.actionImage} alt="İyileştirme Sonrası" className="w-full h-full object-cover" />
                      <a href={form.actionImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white transition-opacity">Görüntüle</a>
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed rounded px-3 py-1.5 hover:border-foreground/40 transition-colors bg-background">
                    {uploadingField === 'actionImage' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Yükle
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage('actionImage', e.target.files[0]); }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/10 mt-4">
              <h5 className="text-sm font-bold mb-4">İyileştirme Sonrası Risk Skoru</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Olasılık (P)</label>
                  <select value={form.finalProb} onChange={(e) => handleScoreInput('finalProb', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {PROBABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Frekans (F)</label>
                  <select value={form.finalFreq} onChange={(e) => handleScoreInput('finalFreq', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Şiddet (S)</label>
                  <select value={form.finalSev} onChange={(e) => handleScoreInput('finalSev', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Risk Puanı</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{form.finalScore || '0'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">Risk Seviyesi</span>
                  <Badge variant="outline" className={\`font-semibold \${finalLevelInfo.badge}\`}>{finalLevelInfo.label}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bölüm 4: İyileştirme Etkinlik Ölçümü */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">4. Bölüm: İyileştirme Etkinlik Ölçümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Etkinlik Ölçüm Yöntemi</label>
                <Input value={form.effectivenessMethod} onChange={(e) => updateField('effectivenessMethod', e.target.value)} placeholder="Örn: 30 gün boyunca haftalık saha denetimleri" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">İyileştirme Kontrol Sorumlusu</label>
                <select value={form.controlResponsible} onChange={(e) => updateField('controlResponsible', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {settingsDepartments.map((dept: any) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Sonuç</label>
              <Textarea value={form.controlResult} onChange={(e) => updateField('controlResult', e.target.value)} placeholder="Örn: Yapılan denetimlerde sorun görülmedi." rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>
`;
