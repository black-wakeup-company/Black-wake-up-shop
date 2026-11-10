import React, { useState } from 'react';
import { Sale } from '../../types/boutique';
import { useBoutique } from '../../context/BoutiqueContext';
import { Printer, Download, X, CheckCircle2, FileText, Receipt, ExternalLink } from 'lucide-react';
import { printReceiptOrInvoice, openPrintWindow } from '../../utils/printHelper';

interface ReceiptModalProps {
  sale: Sale;
  onClose: () => void;
}

type PrintFormat = 'ticket' | 'facture';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ sale, onClose }) => {
  const { settings, formatMoney, exchangeRateUSD } = useBoutique();
  const [printFormat, setPrintFormat] = useState<PrintFormat>('ticket');

  const currentRate = sale.exchangeRateUsed || exchangeRateUSD || 2850;
  const totalInUSD = sale.total / currentRate;
  const subtotalInUSD = sale.subtotal / currentRate;

  const handlePrint = () => {
    printReceiptOrInvoice('printable-document', `${printFormat === 'facture' ? 'Facture' : 'Ticket'}_${sale.id}`);
  };

  const handleOpenPrintWindow = () => {
    const el = document.getElementById('printable-document');
    if (el) {
      openPrintWindow(el, `${printFormat === 'facture' ? 'Facture' : 'Ticket'}_${sale.id}`);
    } else {
      window.print();
    }
  };

  const handleDownloadTxt = () => {
    const textContent = `
============================================================
              ${settings.boutiqueName.toUpperCase()}
              ${settings.slogan || ''}
              ${settings.address || ''}
              Tél: ${settings.phone || ''}
              ${settings.nifOrSiret ? `NIF/RCCM: ${settings.nifOrSiret}` : ''}
============================================================
DOCUMENT: ${printFormat === 'facture' ? 'FACTURE COMMERCIALE' : 'TICKET DE CAISSE'}
Numéro: ${sale.id}
Date: ${new Date(sale.date).toLocaleString('fr-FR')}
Caissier: ${sale.cashierName}
Client: ${sale.customerName}
Taux de change appliqué: 1 USD = ${currentRate.toLocaleString('fr-FR')} FC
------------------------------------------------------------
ARTICLES:
${sale.items
  .map(
    (item, idx) =>
      `${(idx + 1).toString().padStart(2, '0')}. ${item.productName} (Réf: ${item.sku})
    Qté: ${item.quantity} x ${formatMoney(item.unitPrice)} | Total: ${formatMoney(item.total)}${
        item.discountPercentage > 0 ? ` (-${item.discountPercentage}%)` : ''
      }`
  )
  .join('\n')}
------------------------------------------------------------
Sous-total HT: ${formatMoney(sale.subtotal)} (${subtotalInUSD.toFixed(2)} USD)
${sale.discountTotal > 0 ? `Remises totales: -${formatMoney(sale.discountTotal)}\n` : ''}${
      settings.taxEnabled ? `Dont TVA (${settings.taxRate}%): ${formatMoney(sale.taxTotal)}\n` : ''
    }============================================================
TOTAL NET A PAYER: ${formatMoney(sale.total)} (~ ${totalInUSD.toFixed(2)} USD)
============================================================
Mode de règlement: ${sale.paymentMethod.toUpperCase()}
${
  sale.paymentMethod === 'especes'
    ? `Montant reçu: ${
        sale.paidInCurrency === 'USD'
          ? `${sale.amountReceived.toFixed(2)} USD`
          : `${sale.amountReceived.toLocaleString('fr-FR')} FC`
      }\nMonnaie rendue: ${
        sale.changeCurrency === 'USD'
          ? `${sale.changeGiven.toFixed(2)} USD`
          : `${sale.changeGiven.toLocaleString('fr-FR')} FC`
      }\n`
    : ''
}Mentions: ${settings.receiptFooterMessage}
============================================================
    `.trim();

    const element = document.createElement('a');
    const file = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `${printFormat === 'facture' ? 'Facture' : 'Ticket'}_${sale.id}.txt`;
    document.body.appendChild(element);
    element.click();
    element.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div
        className={`relative w-full bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/70 my-4 sm:my-8 transition-all ${
          printFormat === 'facture' ? 'max-w-3xl' : 'max-w-md'
        }`}
      >
        {/* Header bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 sm:px-6 py-3.5 bg-gradient-to-r from-[#10251f] to-[#075b43] text-white">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide">
              {printFormat === 'facture' ? 'Facture Commerciale Validée' : 'Ticket de Caisse Validé'}
            </span>
            <span className="font-mono text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              #{sale.id}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector Pills */}
        <div className="bg-slate-100 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setPrintFormat('ticket')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                printFormat === 'ticket'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>Ticket POS (80mm)</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintFormat('facture')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                printFormat === 'facture'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Facture Standard (A4)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Taux : <span className="font-mono font-bold text-slate-700">1 $ = {currentRate.toLocaleString('fr-FR')} FC</span>
          </div>
        </div>

        {/* Printable View Container with dynamic scroll for review */}
        <div className="p-3 sm:p-6 bg-slate-100/70 max-h-[70vh] overflow-y-auto flex justify-center">
          {/* ========================================================================= */}
          {/* FORMAT 1: TICKET DE CAISSE THERMIQUE 80mm */}
          {/* ========================================================================= */}
          {printFormat === 'ticket' ? (
            <div
              id="printable-document"
              className="format-ticket w-full max-w-[340px] bg-white border border-slate-300 p-4 sm:p-5 shadow-sm text-slate-950 font-mono text-xs rounded-sm"
            >
              {/* Store Header */}
              <div className="text-center pb-3 border-b border-dashed border-slate-300 print-avoid-break">
                {settings.logo && (
                  <div className="flex justify-center mb-2">
                    <img
                      src={settings.logo}
                      alt={settings.boutiqueName}
                      className="max-h-12 max-w-[130px] object-contain filter grayscale"
                    />
                  </div>
                )}
                <h2 className="font-bold text-sm text-slate-950 uppercase tracking-wider">
                  {settings.boutiqueName}
                </h2>
                {settings.slogan && <p className="text-[10px] text-slate-600 mt-0.5">{settings.slogan}</p>}
                <p className="text-[10px] text-slate-700 mt-1">{settings.address}</p>
                <p className="text-[10px] text-slate-700">Tél : {settings.phone}</p>
                {settings.nifOrSiret && (
                  <p className="text-[9px] text-slate-500 mt-0.5 font-sans font-semibold">
                    RCCM/NIF : {settings.nifOrSiret}
                  </p>
                )}
              </div>

              {/* Meta information */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1 print-avoid-break">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ticket N° :</span>
                  <span className="font-bold text-slate-900">{sale.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date & Heure :</span>
                  <span>{new Date(sale.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Caissier :</span>
                  <span>{sale.cashierName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Client :</span>
                  <span className="font-semibold text-slate-900">{sale.customerName}</span>
                </div>
              </div>

              {/* Line Items */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-2">
                <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase tracking-wider pb-1">
                  <span>Désignation</span>
                  <span>Total</span>
                </div>
                {sale.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5 print-avoid-break">
                    <div className="flex justify-between font-medium text-slate-900">
                      <span className="break-words max-w-[200px] leading-tight font-sans text-xs">
                        {item.productName}
                      </span>
                      <span className="tabular-nums font-bold shrink-0 ml-1">{formatMoney(item.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-600 font-mono">
                      <span>
                        {item.quantity} x {formatMoney(item.unitPrice)}
                        {item.discountPercentage > 0 && ` (-${item.discountPercentage}%)`}
                      </span>
                      <span className="text-slate-500">Réf: {item.sku}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Totals */}
              <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px] print-avoid-break">
                <div className="flex justify-between text-slate-700">
                  <span>Sous-total HT</span>
                  <span className="tabular-nums">{formatMoney(sale.subtotal)}</span>
                </div>
                {sale.discountTotal > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Remise accordée</span>
                    <span className="tabular-nums">-{formatMoney(sale.discountTotal)}</span>
                  </div>
                )}
                {settings.taxEnabled && (
                  <div className="flex justify-between text-slate-600 text-[10px]">
                    <span>Dont TVA ({settings.taxRate}%)</span>
                    <span className="tabular-nums">{formatMoney(sale.taxTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-bold text-slate-950 pt-2 border-t border-slate-300">
                  <span>TOTAL NET</span>
                  <div className="text-right">
                    <span className="tabular-nums block text-base font-bold">{formatMoney(sale.total)}</span>
                    <span className="text-[10px] text-slate-600 font-normal">
                      ~ {totalInUSD.toFixed(2)} USD
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="py-2.5 border-b border-dashed border-slate-300 text-[11px] space-y-1 print-avoid-break">
                <div className="flex justify-between">
                  <span className="text-slate-500">Taux appliqué :</span>
                  <span className="font-mono">1 $ = {currentRate.toLocaleString('fr-FR')} FC</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Règlement :</span>
                  <span className="font-semibold uppercase text-slate-900">
                    {sale.paymentMethod === 'especes'
                      ? `Espèces (${sale.paidInCurrency || 'FC'})`
                      : sale.paymentMethod === 'carte'
                      ? 'Carte Bancaire'
                      : sale.paymentMethod === 'mobile_money'
                      ? 'Mobile Money'
                      : sale.paymentMethod === 'credit'
                      ? 'Compte Crédit'
                      : 'Virement'}
                  </span>
                </div>
                {sale.paymentMethod === 'especes' && (
                  <>
                    <div className="flex justify-between text-slate-700">
                      <span>Montant Reçu :</span>
                      <span className="tabular-nums font-mono font-semibold">
                        {sale.paidInCurrency === 'USD'
                          ? `${sale.amountReceived.toFixed(2)} $`
                          : `${sale.amountReceived.toLocaleString('fr-FR')} FC`}
                      </span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Monnaie Rendue :</span>
                      <span className="tabular-nums font-mono">
                        {sale.changeCurrency === 'USD'
                          ? `${sale.changeGiven.toFixed(2)} $`
                          : `${sale.changeGiven.toLocaleString('fr-FR')} FC`}
                      </span>
                    </div>
                  </>
                )}
                {sale.paymentMethod === 'credit' && (
                  <div className="p-1.5 bg-amber-50 text-amber-900 rounded text-[10px] text-center font-sans mt-1">
                    Enregistré au compte crédit de {sale.customerName}
                  </div>
                )}
              </div>

              {/* Barcode & Footer note */}
              <div className="pt-3 pb-1 text-center print-avoid-break">
                <div className="flex items-center justify-center gap-1 text-[8px] tracking-widest text-slate-500 select-none">
                  ||| | || |||| | ||| || |||| ||| | ||||| | || ||
                </div>
                <div className="text-[10px] text-slate-600 font-mono mt-0.5">{sale.id}</div>
                <p className="text-[10px] text-slate-700 mt-2 font-sans italic px-2">
                  {settings.receiptFooterMessage}
                </p>
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* FORMAT 2: FACTURE COMMERCIALE STANDARD A4 / A5 */
            /* ========================================================================= */
            <div
              id="printable-document"
              className="format-facture w-full bg-white border border-slate-300 p-6 sm:p-8 shadow-sm text-slate-900 text-xs rounded-sm space-y-6"
            >
              {/* Header: Company & Invoice Info */}
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-4 border-b-2 border-slate-900 print-avoid-break">
                {/* Store brand */}
                <div className="space-y-1 max-w-sm">
                  {settings.logo && (
                    <img
                      src={settings.logo}
                      alt={settings.boutiqueName}
                      className="max-h-14 max-w-[160px] object-contain mb-2"
                    />
                  )}
                  <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
                    {settings.boutiqueName}
                  </h1>
                  {settings.slogan && (
                    <p className="text-xs text-slate-500 italic font-medium">{settings.slogan}</p>
                  )}
                  <p className="text-xs text-slate-600">{settings.address}</p>
                  <p className="text-xs text-slate-600">
                    Tél : <span className="font-semibold">{settings.phone}</span>
                  </p>
                  {settings.nifOrSiret && (
                    <p className="text-xs text-slate-700 font-semibold">
                      RCCM / NIF / Identifiant : {settings.nifOrSiret}
                    </p>
                  )}
                </div>

                {/* Invoice Meta Box */}
                <div className="sm:text-right bg-slate-50 p-4 rounded-xl border border-slate-200 min-w-[240px]">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white mb-2">
                    Facture Commerciale
                  </span>
                  <div className="text-sm font-bold font-mono text-slate-950">
                    N° {sale.id}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">
                    Date : <span className="font-semibold text-slate-900">{new Date(sale.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Heure : <span className="font-semibold text-slate-900">{new Date(sale.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Caissier : <span className="font-semibold text-slate-900">{sale.cashierName}</span>
                  </div>
                </div>
              </div>

              {/* Client & Billing Box */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-avoid-break">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Facturé à (Client)
                  </div>
                  <div className="text-sm font-bold text-slate-950">{sale.customerName}</div>
                  <div className="text-xs text-slate-600 mt-0.5">Client de l'établissement</div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Règlement & Devise
                  </div>
                  <div className="text-xs text-slate-800">
                    Mode : <strong className="uppercase">{sale.paymentMethod}</strong>
                  </div>
                  <div className="text-xs text-slate-800 font-mono mt-0.5">
                    Taux du jour : <strong>1 USD = {currentRate.toLocaleString('fr-FR')} FC</strong>
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold mt-0.5">
                    Statut : Facture acquittée
                  </div>
                </div>
              </div>

              {/* Line items full table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[11px] uppercase tracking-wider">
                      <th className="py-2.5 px-3 font-semibold border border-slate-800">#</th>
                      <th className="py-2.5 px-3 font-semibold border border-slate-800">Désignation</th>
                      <th className="py-2.5 px-3 font-semibold border border-slate-800">Réf (SKU)</th>
                      <th className="py-2.5 px-3 font-semibold border border-slate-800 text-center">Qté</th>
                      <th className="py-2.5 px-3 font-semibold border border-slate-800 text-right">PU (FC)</th>
                      <th className="py-2.5 px-3 font-semibold border border-slate-800 text-right">Total (FC)</th>
                      <th className="py-2.5 px-3 font-semibold border border-slate-800 text-right">Total (USD)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {sale.items.map((item, idx) => {
                      const itemTotalUSD = item.total / currentRate;
                      return (
                        <tr key={idx} className="print-avoid-break hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono text-slate-500 border border-slate-200 text-center">
                            {idx + 1}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-900 border border-slate-200">
                            {item.productName}
                            {item.discountPercentage > 0 && (
                              <span className="ml-2 text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                                Remise -{item.discountPercentage}%
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-600 border border-slate-200 text-xs">
                            {item.sku}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-center font-bold text-slate-900 border border-slate-200">
                            {item.quantity}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-slate-700 border border-slate-200">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="py-2.5 px-3 font-mono font-bold text-right text-slate-900 border border-slate-200">
                            {formatMoney(item.total)}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-right text-slate-600 border border-slate-200">
                            {itemTotalUSD.toFixed(2)} $
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals & Signature layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2 print-avoid-break">
                {/* Left: Notes & Stamp box */}
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-slate-900 block">Mentions légales & Conditions :</span>
                    <p>{settings.receiptFooterMessage}</p>
                    {sale.notes && <p className="italic text-slate-500">Note : {sale.notes}</p>}
                  </div>

                  <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center h-28 flex flex-col justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Pour acquit · Signature & Cachet
                    </span>
                    <span className="text-[9px] text-slate-400">Merci de votre confiance !</span>
                  </div>
                </div>

                {/* Right: Dual currency totals summary */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total HT :</span>
                    <span className="font-mono tabular-nums font-semibold">{formatMoney(sale.subtotal)}</span>
                  </div>

                  {sale.discountTotal > 0 && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>Remise totale accordée :</span>
                      <span className="font-mono tabular-nums">-{formatMoney(sale.discountTotal)}</span>
                    </div>
                  )}

                  {settings.taxEnabled && (
                    <div className="flex justify-between text-slate-600">
                      <span>TVA ({settings.taxRate}%) :</span>
                      <span className="font-mono tabular-nums">{formatMoney(sale.taxTotal)}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline">
                    <span className="font-bold text-sm text-slate-950">TOTAL NET A PAYER :</span>
                    <div className="text-right">
                      <span className="font-mono font-bold text-lg text-slate-950 block">
                        {formatMoney(sale.total)}
                      </span>
                      <span className="font-mono text-xs font-semibold text-slate-600 block">
                        Soit {totalInUSD.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  {sale.paymentMethod === 'especes' && (
                    <div className="pt-2 border-t border-slate-200 text-[11px] space-y-1 text-slate-600">
                      <div className="flex justify-between">
                        <span>Montant Reçu :</span>
                        <span className="font-mono font-bold">
                          {sale.paidInCurrency === 'USD'
                            ? `${sale.amountReceived.toFixed(2)} $`
                            : `${sale.amountReceived.toLocaleString('fr-FR')} FC`}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-bold">
                        <span>Monnaie Restituée :</span>
                        <span className="font-mono">
                          {sale.changeCurrency === 'USD'
                            ? `${sale.changeGiven.toFixed(2)} $`
                            : `${sale.changeGiven.toLocaleString('fr-FR')} FC`}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 bg-white border-t border-slate-200">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              title="Télécharger une version texte du ticket"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Télécharger</span> TXT
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Nouveau bouton 'Imprimer' style fond noir, icône et texte en vert */}
            <button
              onClick={handleOpenPrintWindow}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-emerald-400 bg-slate-950 hover:bg-slate-900 border border-emerald-500/30 rounded-xl transition-all shadow-md cursor-pointer active:scale-95"
              title="Lancer l'impression ou enregistrer en PDF"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              <span>Imprimer</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
