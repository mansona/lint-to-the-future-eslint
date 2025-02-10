# Changelog

## Release (2025-02-10)

lint-to-the-future-eslint 3.0.0 (major)

#### :boom: Breaking Change
* `lint-to-the-future-eslint`
  * [#41](https://github.com/mansona/lint-to-the-future-eslint/pull/41) drop support for eslint 7 ([@mansona](https://github.com/mansona))
  * [#35](https://github.com/mansona/lint-to-the-future-eslint/pull/35) drop support for node <18 ([@mansona](https://github.com/mansona))

#### :rocket: Enhancement
* `lint-to-the-future-eslint`
  * [#40](https://github.com/mansona/lint-to-the-future-eslint/pull/40) support filter ignore ([@mansona](https://github.com/mansona))
  * [#39](https://github.com/mansona/lint-to-the-future-eslint/pull/39) convert to esmodule ([@mansona](https://github.com/mansona))

#### :bug: Bug Fix
* `lint-to-the-future-eslint`
  * [#38](https://github.com/mansona/lint-to-the-future-eslint/pull/38) fix absolute file paths in output ([@mansona](https://github.com/mansona))

#### :house: Internal
* `lint-to-the-future-eslint`
  * [#42](https://github.com/mansona/lint-to-the-future-eslint/pull/42) update release plan ([@mansona](https://github.com/mansona))
  * [#37](https://github.com/mansona/lint-to-the-future-eslint/pull/37) move to vitest ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2024-11-01)

lint-to-the-future-eslint 2.2.0 (minor)

#### :rocket: Enhancement
* `lint-to-the-future-eslint`
  * [#34](https://github.com/mansona/lint-to-the-future-eslint/pull/34) add support for eslint-9 ([@mansona](https://github.com/mansona))

#### :house: Internal
* `lint-to-the-future-eslint`
  * [#32](https://github.com/mansona/lint-to-the-future-eslint/pull/32) add a test to cover the case of an empty eslint-disable ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2024-10-03)

lint-to-the-future-eslint 2.1.3 (patch)

#### :bug: Bug Fix
* `lint-to-the-future-eslint`
  * [#30](https://github.com/mansona/lint-to-the-future-eslint/pull/30) Support shebang files ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2024-10-01)

lint-to-the-future-eslint 2.1.2 (patch)

#### :bug: Bug Fix
* `lint-to-the-future-eslint`
  * [#28](https://github.com/mansona/lint-to-the-future-eslint/pull/28) use the right name for filter ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2024-09-30)

lint-to-the-future-eslint 2.1.1 (patch)

#### :house: Internal
* `lint-to-the-future-eslint`
  * [#26](https://github.com/mansona/lint-to-the-future-eslint/pull/26) remove npmrc ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

## Release (2024-09-30)

lint-to-the-future-eslint 2.1.0 (minor)

#### :rocket: Enhancement
* `lint-to-the-future-eslint`
  * [#21](https://github.com/mansona/lint-to-the-future-eslint/pull/21) add remove api ([@mansona](https://github.com/mansona))

#### :house: Internal
* `lint-to-the-future-eslint`
  * [#24](https://github.com/mansona/lint-to-the-future-eslint/pull/24) use release-plan ([@mansona](https://github.com/mansona))
  * [#22](https://github.com/mansona/lint-to-the-future-eslint/pull/22) swap to eslint recommended ([@mansona](https://github.com/mansona))
  * [#23](https://github.com/mansona/lint-to-the-future-eslint/pull/23) move list test to fixturify-project ([@mansona](https://github.com/mansona))
  * [#20](https://github.com/mansona/lint-to-the-future-eslint/pull/20) swap to fixturify project ([@mansona](https://github.com/mansona))
  * [#19](https://github.com/mansona/lint-to-the-future-eslint/pull/19) add prettier ([@mansona](https://github.com/mansona))
  * [#18](https://github.com/mansona/lint-to-the-future-eslint/pull/18) swap to pnpm ([@mansona](https://github.com/mansona))

#### Committers: 1
- Chris Manson ([@mansona](https://github.com/mansona))

v2.0.1 / 2023-02-23
==================
* Add license #16 from @RobbieTheWagner

v2.0.0 / 2023-01-13
==================
* Improve .gitignore handling #13 from @wagenet
* Sort lints for stability #12 from @wagenet

v1.0.1 / 2022-09-19
==================
* stop ignoring eslint warnings #11 from @mansona
* Add eslint versions to a test matrix #10 from @mansona

v1.0.0 / 2022-06-21
==================
This is not a major release, it just marks a point where the plugin is considered stable enough
to be v1.0 🎉

* Make regular expression resilient to // eslint-disable-next-line declarations #6 from @locks
* fix typo in README.md #8 from @locks
* add a test for list function #7 from @mansona

v0.4.0 / 2022-05-12
==================
* Make sure `.ts` files are also processed in list command #5 from @jamescdavis

v0.3.1 / 2021-12-23
==================
* Fix issue with caret dependency of eslint and add a test to verify ignore works #3 from @mansona

v0.3.0 / 2021-10-19
==================
* add automatic release system #2 from @mansona
* add support for eslint 8 #1 from @mansona

v0.2.1 / 2020-12-16
==================
* stop trying to execute on folders from @mansona

v0.2.0 / 2020-12-16
==================
* implement list command from @mansona

v0.1.0 / 2020-12-13
==================
* port implementation as plugin from lint-to-the-future from @mansona
