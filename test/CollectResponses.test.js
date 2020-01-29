const { expect } = require('chai')
const sinon = require('sinon')
const { coreLogic } = require('../components/CollectResponses')
const { newMockMakeContactable } = require('rsf-contactable')

describe('CollectResponses', function() {
  context(
    'when timeout is reached, regardless if no responses have been added',
    function() {
      it('should early exit and return 0 results', done => {
        const contactables = []
        const maxResponses = 2
        const maxSeconds = 1
        const prompt = ''
        const anonymous = false
        const share = false
        coreLogic(
          contactables,
          maxResponses,
          maxSeconds,
          prompt,
          anonymous,
          share
        ).then(results => {
          expect(results.length).to.equal(0)
          done()
        })
      })
    }
  )

  context(
    'when the number of participants is 1 and the process completes through user action, not the timeout',
    function() {
      it('the number of responses should equal the number of participants times the max number of responses per participant', done => {
        const mockMakeContactable = newMockMakeContactable(sinon.spy)
        const contactables = [{ id: 'dude' }].map(mockMakeContactable)
        const maxResponses = 2
        const maxSeconds = 4
        const prompt = ''
        const anonymous = false
        const share = false
        coreLogic(
          contactables,
          maxResponses,
          maxSeconds,
          prompt,
          anonymous,
          share
        ).then(results => {
          expect(results.length).to.equal(2)
          expect(results[0].text).to.equal('hi')
          expect(results[1].text).to.equal('hi again')
          done()
        })
        contactables[0].trigger('hi')
        contactables[0].trigger('hi again')
      })
    }
  )

  context(
    'when the number of participants is 2 and the process completes through user action, not the timeout',
    function() {
      it('the number of responses should still equal the number of participants times the max number of responses per participant', done => {
        const mockMakeContactable = newMockMakeContactable(sinon.spy)
        const contactables = [{ id: 'p1' }, { id: 'p2' }].map(
          mockMakeContactable
        )
        const maxResponses = 2
        const maxSeconds = 4
        const prompt = ''
        const anonymous = false
        const share = false
        coreLogic(
          contactables,
          maxResponses,
          maxSeconds,
          prompt,
          anonymous,
          share
        ).then(results => {
          expect(results.length).to.equal(4)
          expect(results[0].text).to.equal('hi')
          expect(results[1].text).to.equal('hi again')
          expect(results[2].text).to.equal('idea')
          expect(results[3].text).to.equal('idea again')
          done()
        })
        contactables[0].trigger('hi')
        contactables[0].trigger('hi again')
        contactables[1].trigger('idea')
        contactables[1].trigger('idea again')
      })
    }
  )

  context('context and rules should be conveyed', function() {
    it('should convey useful feedback to the participants', done => {
      const mockMakeContactable = newMockMakeContactable(sinon.spy)
      const contactables = [{ id: 'dude' }].map(mockMakeContactable)
      const maxResponses = 3
      const maxSeconds = 1
      const prompt = 'prompt'
      const anonymous = false
      const share = false
      coreLogic(
        contactables,
        maxResponses,
        maxSeconds,
        prompt,
        anonymous,
        share
      ).then(() => {
        const spoken = contactables[0].speak
        expect(spoken.getCall(0).args[0]).to.equal(
          'Contribute one response per message. \nYou can contribute up to 3 responses. \nThe process will stop automatically after a few seconds.'
        )
        expect(spoken.getCall(1).args[0]).to.equal('prompt')
        expect(spoken.getCall(2).args[0]).to.equal(
          'The max time has been reached. Stopping now. Thanks for participating.'
        )
        done()
      })
      contactables[0].trigger('hi')
    })
  })

  context('when allowing unlimited responses', function() {
    it('should accurately convey that message to participants', done => {
      const mockMakeContactable = newMockMakeContactable(sinon.spy)
      const contactables = [{ id: 'dude' }].map(mockMakeContactable)
      const maxResponses = Infinity
      const maxSeconds = 1
      const prompt = 'prompt'
      const anonymous = false
      const share = false
      coreLogic(
        contactables,
        maxResponses,
        maxSeconds,
        prompt,
        anonymous,
        share
      ).then(() => {
        const spoken = contactables[0].speak
        expect(spoken.getCall(0).args[0]).to.equal(
          `Contribute one response per message. 
You can contribute unlimited responses. 
The process will stop automatically after a few seconds.`
        )
        done()
      })
    })
  })

  context('when participants reach a set response cap', function() {
    it('should stop accepting responses from them, but keep accepting responses from others', done => {
      const mockMakeContactable = newMockMakeContactable(sinon.spy)
      const contactables = [{ id: 'dude' }, { id: 'dudette' }].map(
        mockMakeContactable
      )
      const maxResponses = 1
      const maxSeconds = 2
      const prompt = 'prompt'
      const anonymous = false
      const share = false
      coreLogic(
        contactables,
        maxResponses,
        maxSeconds,
        prompt,
        anonymous,
        share
      ).then(results => {
        // check the results
        expect(results.length).to.equal(2)
        expect(results[0].text).to.equal('first response')
        expect(results[1].text).to.equal('other first response')

        const spoken = contactables[0].speak
        // give them the instructions
        expect(spoken.getCall(0).args[0]).to.equal(
          `Contribute one response per message. 
You can contribute up to 1 responses. 
The process will stop automatically after a few seconds.`
        )
        // give them the prompt
        expect(spoken.getCall(1).args[0]).to.equal('prompt')
        // let them know they've capped
        expect(spoken.getCall(2).args[0]).to.equal(
          "You've reached the limit of responses. Thanks for participating. You will be notified when everyone has completed."
        )
        // let them know everyone's done
        expect(spoken.getCall(3).args[0]).to.equal(
          'Everyone has completed. Thanks for participating.'
        )
        done()
      })
      setTimeout(() => {
        contactables[0].trigger('first response')
        contactables[0].trigger('second response')
        contactables[0].trigger('third response')
        contactables[1].trigger('other first response')
      }, 700)
    })
  })

  context('when share is set to true', function() {
    context('and anonymous is set to false', function() {
      it('should send each succesful result from participants to all other participants openly, along with who contributed it', done => {
        const mockMakeContactable = newMockMakeContactable(sinon.spy)
        const contactables = [{ id: 'dude' }, { id: 'dudette' }].map(
          mockMakeContactable
        )
        const maxResponses = 2
        const maxSeconds = 2
        const prompt = 'prompt'
        const anonymous = false
        const share = true
        coreLogic(
          contactables,
          maxResponses,
          maxSeconds,
          prompt,
          anonymous,
          share
        ).then(results => {
          // check the results
          expect(results.length).to.equal(4)
          expect(results[0].text).to.equal('first response')
          expect(results[1].text).to.equal('second response')
          expect(results[2].text).to.equal('other first response')
          expect(results[3].text).to.equal('other second response')

          const spoken1 = contactables[0].speak
          const spoken2 = contactables[1].speak
          // give them the instructions
          expect(spoken1.getCall(0).args[0]).to.equal(
            `Contribute one response per message. 
You can contribute up to 2 responses. 
The process will stop automatically after a few seconds.`
          )
          // give them the prompt
          expect(spoken1.getCall(1).args[0]).to.equal('prompt')

          // show that results from first person were sent to second person
          expect(spoken2.getCall(2).args[0]).to.equal(
            'dude@test: first response'
          )
          expect(spoken2.getCall(3).args[0]).to.equal(
            'dude@test: second response'
          )
          // show that results from second person were sent to first person
          // 3 and 4 because will have received a 'max responses' message
          expect(spoken1.getCall(3).args[0]).to.equal(
            'dudette@test: other first response'
          )
          expect(spoken1.getCall(4).args[0]).to.equal(
            'dudette@test: other second response'
          )
          done()
        })
        setTimeout(() => {
          contactables[0].trigger('first response')
          contactables[0].trigger('second response')
          contactables[1].trigger('other first response')
          contactables[1].trigger('other second response')
        }, 700)
      })
    })

    context('and anonymous is set to true', function() {
      it('should send each succesful result from participants to all other participants openly, without saying who', done => {
        const mockMakeContactable = newMockMakeContactable(sinon.spy)
        const contactables = [{ id: 'dude' }, { id: 'dudette' }].map(
          mockMakeContactable
        )
        const maxResponses = 2
        const maxSeconds = 2
        const prompt = 'prompt'
        const anonymous = true
        const share = true
        coreLogic(
          contactables,
          maxResponses,
          maxSeconds,
          prompt,
          anonymous,
          share
        ).then(results => {
          // check the results
          expect(results.length).to.equal(4)
          expect(results[0].text).to.equal('first response')
          expect(results[1].text).to.equal('second response')
          expect(results[2].text).to.equal('other first response')
          expect(results[3].text).to.equal('other second response')
          // verify anonymity
          expect(results[0].contact).to.equal(undefined)

          const spoken1 = contactables[0].speak
          const spoken2 = contactables[1].speak
          // give them the instructions
          expect(spoken1.getCall(0).args[0]).to.equal(
            `Contribute one response per message. 
You can contribute up to 2 responses. 
The process will stop automatically after a few seconds.`
          )
          // give them the prompt
          expect(spoken1.getCall(1).args[0]).to.equal('prompt')

          // show that results from first person were sent to second person
          expect(spoken2.getCall(2).args[0]).to.equal(
            'new result: first response'
          )
          expect(spoken2.getCall(3).args[0]).to.equal(
            'new result: second response'
          )
          // show that results from second person were sent to first person
          // 3 and 4 because will have received a 'max responses' message
          expect(spoken1.getCall(3).args[0]).to.equal(
            'new result: other first response'
          )
          expect(spoken1.getCall(4).args[0]).to.equal(
            'new result: other second response'
          )
          done()
        })
        setTimeout(() => {
          contactables[0].trigger('first response')
          contactables[0].trigger('second response')
          contactables[1].trigger('other first response')
          contactables[1].trigger('other second response')
        }, 700)
      })
    })
  })
})
