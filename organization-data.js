/* =============================================================================
   BLC — ORGANIZATIONAL STRUCTURE — DATA MODEL & CONFIGURATION
   Phase: 01 (Architecture only)

   This file defines the data contract and placeholder content for the future
   "Organizational Structure" section (built in Phase 02). It intentionally
   contains NO real employee names, NO photographs, and NO fabricated
   biographical or organizational detail — every member record below is a
   structural placeholder pending confirmed HR data.

   Namespacing follows the rest of the site (plain global objects, no bundler,
   no module system) so it drops into the existing static-HTML architecture
   without requiring a build step.
   ============================================================================= */

/**
 * @typedef {Object} OrganizationMember
 * @property {string} id              Stable unique identifier (kebab-case).
 * @property {string} name            English display name.
 * @property {string} nameAr          Arabic display name.
 * @property {string} position        English position/title.
 * @property {string} positionAr      Arabic position/title.
 * @property {string} department      English department name.
 * @property {string} departmentAr    Arabic department name.
 * @property {number} level           Organizational level (1 = most senior).
 * @property {string} [image]         Path to a photo, or the shared neutral
 *                                     placeholder asset when unavailable.
 * @property {string} [bio]           English biography (English placeholder
 *                                     copy until a profile is confirmed).
 * @property {string} [bioAr]         Arabic biography.
 * @property {string} [linkedin]      LinkedIn profile URL, if published.
 * @property {string} [email]         Public contact email, if published.
 * @property {string} [phone]         Public contact phone, if published.
 * @property {'placeholder'|'active'} status  Whether this record represents
 *                                     a confirmed, publishable profile
 *                                     ('active') or a structural placeholder
 *                                     awaiting confirmation ('placeholder').
 * @property {number} order           Display order within its department/level.
 */

(function (global) {
  'use strict';

  /* ---------------------------------------------------------------------
     DEPARTMENT / CATEGORY CONFIGURATION
     Structural placeholders only. Listing a department here does not imply
     it is currently staffed — see QA-P01.md for known limitations.
     --------------------------------------------------------------------- */
  var ORG_CATEGORIES = [
    { id: 'executive',    order: 1,  name: 'Executive Management',        nameAr: 'الإدارة التنفيذية' },
    { id: 'operations',   order: 2,  name: 'Operations',                  nameAr: 'العمليات' },
    { id: 'engineering',  order: 3,  name: 'Engineering',                 nameAr: 'الهندسة' },
    { id: 'hse',          order: 4,  name: 'HSE',                         nameAr: 'الصحة والسلامة والبيئة' },
    { id: 'qaqc',         order: 5,  name: 'QA/QC',                       nameAr: 'ضمان وضبط الجودة' },
    { id: 'commercial',   order: 6,  name: 'Commercial / Contracts',      nameAr: 'التجارية والعقود' },
    { id: 'hr',           order: 7,  name: 'Human Resources',             nameAr: 'الموارد البشرية' },
    { id: 'finance',      order: 8,  name: 'Finance & Administration',    nameAr: 'المالية والإدارة' },
    { id: 'procurement',  order: 9,  name: 'Procurement & Materials',     nameAr: 'المشتريات والمواد' },
    { id: 'training',     order: 10, name: 'Training',                    nameAr: 'التدريب' },
    { id: 'digital',      order: 11, name: 'Digital / IT',                nameAr: 'الرقمنة وتقنية المعلومات' },
    { id: 'logistics',    order: 12, name: 'Logistics & Supply Chain',    nameAr: 'اللوجستيات وسلسلة الإمداد' },
    { id: 'projects',     order: 13, name: 'Projects',                    nameAr: 'المشاريع' },
    { id: 'legal',        order: 14, name: 'Legal Affairs & Compliance',  nameAr: 'الشؤون القانونية والامتثال' },
    { id: 'maintenance',  order: 15, name: 'Technical Services & Maintenance', nameAr: 'الخدمات الفنية والصيانة' },
    { id: 'maintenance-authority', order: 16, name: 'Maintenance Authority',   nameAr: 'هيئة الصيانة' },
    { id: 'accounting-division',   order: 17, name: 'Accounting Division',     nameAr: 'شعبة المحاسبة' },
    { id: 'laboratories-division', order: 18, name: 'Laboratories Division',   nameAr: 'شعبة المختبرات' },
    { id: 'strategic-planning-division', order: 19, name: 'Strategic Planning Division', nameAr: 'شعبة التخطيط الاستراتيجي' },
    { id: 'scaffolding-division', order: 20, name: 'Scaffolding Division', nameAr: 'شعبة السقالات' }
  ];

  /* Shared neutral placeholder image (silhouette icon — not a photograph). */
  var PLACEHOLDER_IMAGE = 'assets/team/placeholder-avatar.svg';

  var BIO_PENDING_EN = 'Position profile will be published soon.';
  var BIO_PENDING_AR = 'سيتم نشر الملف الوظيفي لاحقًا.';

  /* ---------------------------------------------------------------------
     CONFIRMED MEMBER OVERRIDES
     HR-confirmed profiles are added here, keyed by department id, as they
     become available. Each override is merged onto that department's
     placeholder record (same id/order, so filtering and card wiring keep
     working) and flips status to 'active'. Departments with no entry here
     keep rendering the generic placeholder below.
     --------------------------------------------------------------------- */
  var ORG_OVERRIDES = {
    operations: {
      name: 'Aqeel Al-Asadi',
      nameAr: 'عقيل الأسدي',
      position: 'Head of Operations',
      positionAr: 'رئيس قسم العمليات',
      image: 'assets/team/aqeel-alasadi-operations-head.jpg',
      status: 'active'
    },
    procurement: {
      name: 'Ali Al-Asadi',
      nameAr: 'علي الأسدي',
      position: 'Head of Procurement & Materials',
      positionAr: 'رئيس قسم المشتريات والمواد',
      image: 'assets/team/ali-alasadi-procurement-head.jpg',
      status: 'active'
    },
    digital: {
      name: 'Emad Al-Sharaa',
      nameAr: 'عماد الشرع',
      position: 'Head of Digital / IT',
      positionAr: 'رئيس قسم الرقمنة وتقنية المعلومات',
      image: 'assets/team/emad-alsharaa-digital-head.jpg',
      status: 'active'
    },
    training: {
      name: 'Saja Al-Rubaie',
      nameAr: 'سجى الربيعي',
      position: 'Head of Training',
      positionAr: 'رئيسة قسم التدريب',
      image: 'assets/team/saja-alrubaie-training-head.jpg',
      status: 'active'
    },
    commercial: {
      name: 'Zainab Al-Qatrani',
      nameAr: 'زينب القطراني',
      position: 'Head of Commercial / Contracts',
      positionAr: 'رئيسة قسم التجارية والعقود',
      image: 'assets/team/zainab-alqatrani-commercial-head-v2.png',
      status: 'active'
    },
    engineering: {
      name: 'Taha Al-Haddad',
      nameAr: 'طه الحداد',
      position: 'Head of Engineering',
      positionAr: 'رئيس قسم الهندسة',
      image: 'assets/team/taha-alhaddad-engineering-head.jpg',
      status: 'active'
    },
    hse: {
      name: 'Ali Al-Asadi',
      nameAr: 'علي الأسدي',
      position: 'Head of HSE',
      positionAr: 'رئيس قسم الصحة والسلامة والبيئة',
      image: 'assets/team/ali-alasadi-hse-head.png',
      status: 'active'
    },
    executive: {
      name: 'David James Stanford',
      nameAr: 'ديفيد جيمس ستانفورد',
      position: 'General Manager',
      positionAr: 'المدير العام',
      image: 'assets/team/david-stanford-executive-head-v2.png',
      status: 'active'
    },
    qaqc: {
      name: 'Ahmed Al-Aidani',
      nameAr: 'أحمد العيداني',
      position: 'Head of QA/QC',
      positionAr: 'رئيس قسم ضمان وضبط الجودة',
      image: 'assets/team/ahmed-alaidani-qaqc-head.png',
      status: 'active'
    },
    hr: {
      name: 'Fatima Al-Aidani',
      nameAr: 'فاطمة العيداني',
      position: 'Head of Human Resources',
      positionAr: 'رئيسة قسم الموارد البشرية',
      image: 'assets/team/fatima-alaidani-hr-head.png',
      status: 'active'
    },
    finance: {
      name: 'Abbas Al-Asadi',
      nameAr: 'عباس الأسدي',
      position: 'Head of Finance & Administration',
      positionAr: 'رئيس قسم المالية والإدارة',
      image: 'assets/team/abbas-alasadi-finance-head.png',
      status: 'active'
    },
    legal: {
      name: 'Mahmoud Al-Askari',
      nameAr: 'محمود العسكري',
      position: 'Head of Legal Affairs & Compliance',
      positionAr: 'رئيس قسم الشؤون القانونية والامتثال',
      image: 'assets/team/mahmoud-alaskari-legal-head.png',
      status: 'active'
    },
    logistics: {
      name: 'Mohammed Al-Atbi',
      nameAr: 'محمد العطبي',
      position: 'Head of Logistics & Supply Chain',
      positionAr: 'رئيس قسم اللوجستيات وسلسلة الإمداد',
      image: 'assets/team/mohammed-alatbi-logistics-head.png',
      status: 'active'
    },
    projects: {
      name: 'Mohammed Al-Saad',
      nameAr: 'محمد السعد',
      position: 'Head of Projects',
      positionAr: 'رئيس قسم المشاريع',
      image: 'assets/team/mohammed-alsaad-projects-head.png',
      status: 'active'
    },
    maintenance: {
      name: 'Umit Dogan',
      nameAr: 'أوميت دوغان',
      position: 'Head of Technical Services & Maintenance',
      positionAr: 'رئيس قسم الخدمات الفنية والصيانة',
      image: 'assets/team/umit-dogan-maintenance-head.png',
      status: 'active'
    },
    'maintenance-authority': {
      name: 'Wesley MacDonald',
      nameAr: 'ويزلي ماكدونالد',
      position: 'Director of Maintenance Authority',
      positionAr: 'مدير هيئة الصيانة',
      image: 'assets/team/wesley-macdonald-maintenance-director.jpg',
      status: 'active'
    },
    'accounting-division': {
      name: 'Fatima Al-Jubouri',
      nameAr: 'فاطمة الجبوري',
      position: 'Director of Accounting Division',
      positionAr: 'مديرة شعبة المحاسبة',
      image: 'assets/team/fatima-aljubouri-accounting-director.jpg',
      level: 4,
      status: 'active'
    },
    'laboratories-division': {
      name: 'Aseel Al-Khaqani',
      nameAr: 'أسيل الخاقاني',
      position: 'Director of Laboratories Division',
      positionAr: 'مديرة شعبة المختبرات',
      image: 'assets/team/aseel-alkhaqani-laboratories-director.jpg',
      level: 4,
      status: 'active'
    },
    'strategic-planning-division': {
      name: 'Noor Al-Jaf',
      nameAr: 'نور الجاف',
      position: 'Director of Strategic Planning Division',
      positionAr: 'مديرة شعبة التخطيط الاستراتيجي',
      image: 'assets/team/noor-aljaf-strategic-planning-director.jpg',
      level: 4,
      status: 'active'
    },
    'scaffolding-division': {
      name: 'Majid Al-Asadi',
      nameAr: 'ماجد الأسدي',
      position: 'Director of Scaffolding Division',
      positionAr: 'مدير شعبة السقالات',
      image: 'assets/team/majid-alasadi-scaffolding-director.jpg',
      level: 4,
      status: 'active'
    }
  };

  /**
   * Builds one member record per department: the HR-confirmed override when
   * one exists, otherwise a structural placeholder. Executive Management sits
   * at level 1 (General Manager), Maintenance Authority sits at level 2
   * (Director of Maintenance Authority), and every other department sits at
   * level 3 as a generic "Department Head" placeholder (or its HR-confirmed
   * override) so the data model and UI can be exercised without inventing
   * names, titles, or org detail that hasn't been confirmed.
   * @returns {OrganizationMember[]}
   */
  function buildPlaceholderMembers() {
    /** @type {OrganizationMember[]} */
    var members = [];

    ORG_CATEGORIES.forEach(function (dept) {
      var isExecutive = dept.id === 'executive';
      var isMaintenanceAuthority = dept.id === 'maintenance-authority';
      var base = {
        id: dept.id + '-placeholder-01',
        name: '',
        nameAr: '',
        position: isExecutive ? 'General Manager' : 'Department Head',
        positionAr: isExecutive ? 'المدير العام' : 'رئيس القسم',
        department: dept.name,
        departmentAr: dept.nameAr,
        level: isExecutive ? 1 : (isMaintenanceAuthority ? 2 : 3),
        image: PLACEHOLDER_IMAGE,
        bio: BIO_PENDING_EN,
        bioAr: BIO_PENDING_AR,
        linkedin: '',
        email: '',
        phone: '',
        status: 'placeholder',
        order: dept.order
      };

      var override = ORG_OVERRIDES[dept.id];
      if (override) {
        Object.keys(override).forEach(function (key) {
          base[key] = override[key];
        });
      }

      members.push(base);
    });

    return members;
  }

  var ORG_MEMBERS = buildPlaceholderMembers();

  /* ---------------------------------------------------------------------
     PUBLIC API
     Exposed as a plain global (window.BLCOrgData) to match the rest of the
     site's script style. Phase 02's organization-section.js consumes this.
     --------------------------------------------------------------------- */
  global.BLCOrgData = {
    CATEGORIES: ORG_CATEGORIES,
    MEMBERS: ORG_MEMBERS,
    PLACEHOLDER_IMAGE: PLACEHOLDER_IMAGE,
    /**
     * Returns members for a given department id, sorted by level then order.
     * @param {string} departmentId
     * @returns {OrganizationMember[]}
     */
    getByDepartment: function (departmentId) {
      return ORG_MEMBERS
        .filter(function (m) { return m.id.indexOf(departmentId + '-') === 0; })
        .sort(function (a, b) { return a.level - b.level || a.order - b.order; });
    }
  };

})(window);
