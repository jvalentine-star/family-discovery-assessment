/**
 * Strategy Session v2 backend handler.
 *
 * ADDITIVE ONLY:
 * - Keeps existing Discovery + Strategy v1 logic untouched.
 * - Add the one-line route shown below inside the existing doPost(e),
 *   after the request body has been JSON.parsed into a variable called payload.
 *
 *   if (payload.action === 'strategy_submit_v2') {
 *     return handleStrategySubmitV2_(payload);
 *   }
 *
 * If your parsed request variable has another name, use that name instead.
 */

const FAMILY_ASSESSMENT_SPREADSHEET_ID_V2 = '1VcD6FZY41IAiY5CnK32RU4YAsRhCkkr2ucrHmBISpOs';
const DISCOVERY_SHEET_NAME_V2 = 'Discovery Responses';
const STRATEGY_V2_SHEET_NAME = 'Strategy Session v2 Responses';

const STRATEGY_V2_HEADERS = [
  'Submitted At','Version','Family ID','Family / Purchasers','Session Date',
  'Decision Driver','Decisions To Solve','Five Year Success','Timing Requirement','Timing Flexibility','Future Changes','School Stage Scope',
  'Children JSON','Core Priorities JSON','Child-specific Priority Details JSON',
  'School Sector Preference','School Sector Flexibility','School Sector Reason',
  'Gender Preference','Gender Flexibility','Gender Reason','Gender Child Overrides JSON',
  'Same-school Importance','Same-school Flexibility','Split-school Logistics',
  'Faith Importance','Faith Detail','Faith Notes',
  'Preferred Schools JSON','Excluded Schools JSON',
  'Preferred Annual Fee Level','Fee Basis','Fee Flexibility',
  'School Commute Mode','School Commute Ideal Minutes','School Commute Max Minutes','School Commute Flexibility','Independent Travel Notes',
  'Purchase Budget','Budget Flexibility','Property Type','Property Type Flexibility',
  'Home Requirements JSON','Land / Outdoor JSON','Renovation Tolerance','Renovation Flexibility','Other Home / Site / Street JSON',
  'Preferred Areas JSON','Excluded Areas JSON','Destinations JSON','Lifestyle Priorities JSON',
  'Known Finance Changes','Lower-fee Preference','Fee Overrun Tolerance','Fee Overrun Meaning','Government-school Property Trade-off',
  'Current Home Strategy','Current Home Flexibility','Hardest Compromises JSON','Most Flexible Areas JSON',
  'Confirmed Strategy Profile JSON','Consistency Flags JSON','Family Open Questions',
  'Material Unresolved Items JSON','Workflow Actions JSON','Recommendation Blockers JSON','Adviser Notes','Raw JSON','Source Discovery Imported?','QA / Release Status'
];

function handleStrategySubmitV2_(payload) {
  try {
    if (!payload || payload.action !== 'strategy_submit_v2') {
      return strategyV2Json_({ok:false,error:'Invalid v2 strategy action'});
    }

    const familyId = String(payload.family_id || '').trim();
    const token = String(payload.token || '').trim();
    const data = payload.data || {};

    if (!familyId || !token) {
      return strategyV2Json_({ok:false,error:'Missing family ID or access token'});
    }

    const ss = SpreadsheetApp.openById(FAMILY_ASSESSMENT_SPREADSHEET_ID_V2);

    if (!strategyV2Authorised_(ss, familyId, token)) {
      return strategyV2Json_({ok:false,error:'Family record or access token is not valid'});
    }

    if (String(data.version || '') !== '2.0') {
      return strategyV2Json_({ok:false,error:'This endpoint accepts Strategy Session version 2.0 only'});
    }

    const sheet = ss.getSheetByName(STRATEGY_V2_SHEET_NAME);
    if (!sheet) {
      return strategyV2Json_({ok:false,error:'Strategy Session v2 Responses sheet was not found'});
    }

    strategyV2ValidateHeaders_(sheet);

    const f = data.family || {};
    const e = data.education || {};
    const s = data.school_constraints || {};
    const p = data.property || {};
    const l = data.location_lifestyle || {};
    const t = data.financial_tradeoffs || {};
    const c = data.confirmation || {};

    const row = [
      data.created_at || new Date().toISOString(),
      data.version || '2.0',
      familyId,
      f.name || '',
      f.session_date || '',
      f.decision_driver || '',
      f.decisions_to_solve || '',
      f.five_year_success || '',
      f.timing_requirement || '',
      f.timing_flexibility || '',
      f.future_changes || '',
      f.school_stage_scope || '',
      strategyV2Stringify_(data.children || []),
      strategyV2Stringify_(e.core_priorities || []),
      strategyV2Stringify_(e.child_specific_priorities || []),
      s.sector_preference || '',
      s.sector_flexibility || '',
      s.sector_reason || '',
      s.gender_preference || '',
      s.gender_flexibility || '',
      s.gender_reason || '',
      strategyV2Stringify_(s.gender_child_overrides || ''),
      s.same_school_importance || '',
      s.same_school_flexibility || '',
      s.split_school_logistics || '',
      s.faith_importance || '',
      s.faith_detail || '',
      s.faith_notes || '',
      strategyV2Stringify_(s.preferred_schools || ''),
      strategyV2Stringify_(s.excluded_schools || ''),
      s.preferred_fee_level || '',
      s.fee_basis || '',
      s.fee_flexibility || '',
      (s.commute || {}).mode || '',
      (s.commute || {}).ideal_minutes || '',
      (s.commute || {}).max_minutes || '',
      (s.commute || {}).flexibility || '',
      (s.commute || {}).independent_travel_notes || '',
      p.budget || '',
      p.budget_flexibility || '',
      p.property_type || '',
      p.property_type_flexibility || '',
      strategyV2Stringify_(p.home_requirements || {}),
      strategyV2Stringify_(p.land_outdoor || {}),
      p.renovation_tolerance || '',
      p.renovation_flexibility || '',
      strategyV2Stringify_(p.other_home_site_street || ''),
      strategyV2Stringify_(p.preferred_areas || ''),
      strategyV2Stringify_(p.excluded_areas || ''),
      strategyV2Stringify_(l.destinations || []),
      strategyV2Stringify_(l.lifestyle_priorities || ''),
      t.known_finance_changes || '',
      t.lower_fee_preference || '',
      t.fee_overrun_tolerance || '',
      t.fee_overrun_meaning || '',
      t.public_zone_tradeoff || '',
      t.current_home_strategy || '',
      t.current_home_flexibility || '',
      strategyV2Stringify_(t.hardest_compromises || ''),
      strategyV2Stringify_(t.most_flexible_areas || ''),
      strategyV2Stringify_(c.confirmed_strategy_profile || ''),
      strategyV2Stringify_(c.consistency_check || ''),
      c.family_open_questions || '',
      strategyV2Stringify_(data.material_unresolved_items || []),
      strategyV2Stringify_(data.workflow_actions || []),
      strategyV2Stringify_(data.recommendation_blockers || []),
      data.adviser_notes || '',
      JSON.stringify(data),
      data.source_discovery_imported === true,
      'Session confirmed'
    ];

    if (row.length !== STRATEGY_V2_HEADERS.length) {
      return strategyV2Json_({ok:false,error:'Internal v2 field count mismatch'});
    }

    sheet.appendRow(row);

    return strategyV2Json_({
      ok:true,
      version:'2.0',
      family_id:familyId,
      row:sheet.getLastRow(),
      message:'Strategy Session v2 saved'
    });

  } catch (err) {
    console.error(err);
    return strategyV2Json_({
      ok:false,
      error:err && err.message ? err.message : String(err)
    });
  }
}

function strategyV2Authorised_(ss, familyId, token) {
  const sheet = ss.getSheetByName(DISCOVERY_SHEET_NAME_V2);
  if (!sheet) return false;

  const values = sheet.getDataRange().getValues();
  if (!values.length) return false;

  const headers = values[0].map(String);
  const familyCol = headers.indexOf('Family ID');
  const tokenCol = headers.indexOf('Access Token');

  if (familyCol < 0 || tokenCol < 0) return false;

  for (let r = 1; r < values.length; r++) {
    if (String(values[r][familyCol]).trim() === familyId &&
        String(values[r][tokenCol]).trim() === token) {
      return true;
    }
  }
  return false;
}

function strategyV2ValidateHeaders_(sheet) {
  const actual = sheet.getRange(1, 1, 1, STRATEGY_V2_HEADERS.length).getValues()[0].map(String);

  for (let i = 0; i < STRATEGY_V2_HEADERS.length; i++) {
    if (actual[i] !== STRATEGY_V2_HEADERS[i]) {
      throw new Error(
        'Strategy v2 response header mismatch at column ' + (i + 1) +
        '. Expected "' + STRATEGY_V2_HEADERS[i] +
        '" but found "' + (actual[i] || '') + '".'
      );
    }
  }
}

function strategyV2Stringify_(value) {
  if (value === undefined || value === null) return '';
  return JSON.stringify(value);
}

function strategyV2Json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
