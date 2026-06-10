import React from 'react';
// this is just to syntax highlight and prepare the layout snippet.
export const jsx = `
          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> 1. Bölüm: Genel Bilgiler
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Tespit Tarihi</span><span className="font-medium">{risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Risk Kategorisi</span><span className="font-medium">{risk.riskCategory || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Alt Risk Kategorisi</span><span className="font-medium">{risk.subCategory || '-'}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Bölüm</span><span className="font-medium">{risk.department?.name || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Alan</span><span className="font-medium">{risk.area || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Faaliyet (Yapılan İş)</span><span className="font-medium">{risk.activity || '-'}</span></div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 2. Bölüm: Mevcut Durum Değerlendirmesi
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Tehlike</span><span className="font-medium">{risk.hazard || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Risk (Olası Tehlikeli Olay)</span><span className="font-medium">{risk.riskDescription || '-'}</span></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Sonuç/ Olası Etki Zarar</span><span className="font-medium">{risk.impactDamage || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Riskten Etkilenecek Kişiler</span><span className="font-medium">{risk.affectedPeople || '-'}</span></div>
              </div>
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-1">Mevcut Durum Açıklaması</span>
                <span className="font-medium block">{risk.initialCondition || '-'}</span>
              </div>
              <div className="bg-muted/50 border rounded-xl p-5 mt-2">
                <span className="text-sm font-bold text-foreground mb-4 block">Mevcut Risk Skoru</span>
                <div className="flex flex-wrap items-center gap-8">
                  <div><span className="text-muted-foreground block text-xs mb-1">Olasılık (P)</span><span className="font-medium">{risk.initialProb}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Frekans (F)</span><span className="font-medium">{risk.initialFreq}</span></div>
                  <div><span className="text-muted-foreground block text-xs mb-1">Şiddet (S)</span><span className="font-medium">{risk.initialSev}</span></div>
                  <div className="ml-auto flex items-center gap-4">
                    <div><span className="text-muted-foreground block text-xs mb-1">Risk Puanı</span><span className="font-bold text-xl">{risk.initialScore}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-1">Risk Seviyesi</span><LevelBadge level={risk.initialLevel} /></div>
                  </div>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-1 mt-2">İlgili Mevzuat</span>
                <span className="font-medium block">{risk.legislation || '-'}</span>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4" /> 3. Bölüm: İyileştirme Planı / Uygulama
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-1">Alınacak Önlemler / İyileştirici Faaliyet</span>
                <span className="font-medium block">{risk.firstActionPlan || risk.actionsTaken || '-'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">İyileştirme Sorumlusu</span><span className="font-medium">{risk.improvementResponsible || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Termin Tarihi</span><span className="font-medium">{risk.dueDate ? new Date(risk.dueDate).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">Termin Periyodu</span><span className="font-medium">{risk.dueDatePeriod || 'Belli bir tarih'}</span></div>
              </div>
              <div className="pb-3 border-b">
                <span className="text-muted-foreground block text-xs mb-1">İyileştirme Açıklaması</span>
                <span className="font-medium block">{risk.actionsTaken || '-'}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">İyileştirme Tamamlanma Tarihi</span><span className="font-medium">{risk.actionDate ? new Date(risk.actionDate).toLocaleDateString('tr-TR') : '-'}</span></div>
                <div>
                  <span className="text-muted-foreground block text-xs mb-2">İyileştirme Sonrası Görseli</span>
                  {risk.actionImage ? (
                    <img src={risk.actionImage} alt="İyileştirme" className="h-20 object-contain rounded border bg-muted/30" />
                  ) : <span className="font-medium text-muted-foreground">-</span>}
                </div>
              </div>

              <div className={\`border rounded-xl p-5 mt-2 \${risk.finalScore ? 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-muted/30'}\`}>
                <span className="text-sm font-bold text-foreground mb-4 block">İyileştirme Sonrası Risk Skoru</span>
                {risk.finalScore ? (
                  <div className="flex flex-wrap items-center gap-8">
                    <div><span className="text-muted-foreground block text-xs mb-1">Olasılık (P)</span><span className="font-medium">{risk.finalProb}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-1">Frekans (F)</span><span className="font-medium">{risk.finalFreq}</span></div>
                    <div><span className="text-muted-foreground block text-xs mb-1">Şiddet (S)</span><span className="font-medium">{risk.finalSev}</span></div>
                    <div className="ml-auto flex items-center gap-4">
                      <div><span className="text-muted-foreground block text-xs mb-1">Risk Puanı</span><span className="font-bold text-xl text-emerald-600">{risk.finalScore}</span></div>
                      <div><span className="text-muted-foreground block text-xs mb-1">Risk Seviyesi</span><LevelBadge level={risk.finalLevel} /></div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic">İyileştirme skoru girilmemiş.</span>
                )}
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> 4. Bölüm: İyileştirme Etkinlik Ölçümü
            </h3>
            <div className="bg-card border rounded-xl p-5 space-y-4 text-sm shadow-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b">
                <div><span className="text-muted-foreground block text-xs mb-1">Etkinlik Ölçüm Yöntemi</span><span className="font-medium">{risk.effectivenessMethod || '-'}</span></div>
                <div><span className="text-muted-foreground block text-xs mb-1">İyileştirme Kontrol Sorumlusu</span><span className="font-medium">{risk.controlResponsible || '-'}</span></div>
              </div>
              <div>
                <span className="text-muted-foreground block text-xs mb-1">Sonuç</span>
                <span className="font-medium block">{risk.controlResult || '-'}</span>
              </div>
            </div>
          </section>
`;
